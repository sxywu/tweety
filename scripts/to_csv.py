import csv
from datetime import datetime
import glob
import json
import string


"""
processes existing -min.json files into two csvs: metadata (global) and tweets for a user.
i.e. from
tweets:
'148125787172765696', {
          u'c': u'Sat Dec 17 19:41:54 +0000 2011',
          "h": [
                "cocktail",
                "fact"
          ],
          u'name': u'jsundram',
          u'retweet': {u'id': u'147479157947891712', u'name': u'somebitsLinks'},
          u'stats': {u'favorites': 0, u'retweets': 11},
          u'text': u'RT @somebitsLinks: Perceived color brightness: A little color theory for you http://t.co/U7DhlOxq',
          u'um': [{u'name': u'somebitsLinks', u'user_id': 358426597}]}

extract to global metadata
    "id": "55677993",
    "name": "Jason Sundram",
    "numFollowers": 2010,
    "numTweets": 3345,
    "screen_name": "jsundram",

extract the rest (tweet-specific info) to a csv, with columns:
    tweet_id, time, hashtags, faves, retweets, text, mentions
"""

def parse_time(t):
    """Takes string, returns seconds since 1970."""
    dt = datetime.strptime(t, "%a %b %d %H:%M:%S +0000 %Y")
    return int((dt - datetime(1970, 1, 1)).total_seconds())


def flatten(tweet_id, tweet):
    """Takes a tweet_id, tweet pair and returns a row suitable for insertion to a CSV."""
    type_value = ''
    if 'retweet' in tweet:
        type_value = 'rt:%s' % tweet['retweet']['id']
    elif 'in_reply_to' in tweet:
        type_value = 'r:%s' % tweet['in_reply_to']['user_id']

    return [
        tweet_id,
        parse_time(tweet['c']),
        json.dumps(map(string.lower, tweet.get('h', []))),
        type_value,
        tweet['stats']['favorites'],
        tweet['stats']['retweets'],
        tweet['text'].encode('utf-8'),
        # store userid to username mapping just once, not in every row; write user_ids list only
        json.dumps([i['user_id'] for i in tweet.get('um', [])])
    ], tweet.get('um', [])


def process(filename, metadata):
    with open(filename) as f:
        data = json.load(f)

    metadata[str(data['id'])] = [
        data['name'].encode('utf-8'),
        data.get('numFollowers', -1), # @georgialupi is missing numFollowers
        data['numTweets'],
        data['screen_name']
    ]

    outfile = filename.replace('-min.json', '.csv')
    with open(outfile, 'w') as f:
        w = csv.writer(f)

        w.writerow('tweet_id, time, hashtags, type, faves, retweets, text, mentions'.split(', '))
        for (k, v) in data['tweets'].iteritems():
            row, mentions = flatten(k, v)
            w.writerow(row)

            # Update metadata; we will write that separately
            for m in mentions:
                # TL;DR: Don't clobber good metadata for this user if we have it.
                # This could happen if two users chat a lot and are both in the data set.
                # So you process jsundram before shirleyxywu due to the tyranny of the
                # alphabet, and we have metadata for jsundram (name, follower count, etc)
                # But later we get to shirleyxywu's data file, which has metadata
                # for jsundram just in that conversation, with name and userid.
                # We don't want to overwrite the full metadata for jsundram with a subset;
                # that's what the check below accomplishes.
                entry = metadata.get(str(m['user_id']), ['', -1, -1, m['name']])
                if entry[0] == '':
                    metadata[str(m['user_id'])] = entry

def main():
    datadir = '../data/'
    files = glob.glob(datadir + '*-min.json')
    try:
        # One of these files is not like the others.
        files.remove(datadir + 'undefined-min.json')
    except ValueError:
        pass  # It has gotten removed already perhaps by an angel.

    metadata = {}  # This is global; define outside the loop.
    for filename in files:
        username = filename[len(datadir):-9]  # chop off datadir and -min.json
        print("Processing data for %s" % username)

        process(filename, metadata)

    # A bit hacky; Include "width" param in here
    with open(datadir + 'users.json') as f:
        users = json.load(f)
        # metadata is indexed by user id, we want to look up by username; make an index
        metadata_ix = {username: ix for (ix, [_, _, _, username]) in metadata.iteritems()}

        image_widths = {} # userid to imagewidth map
        for u in users:
            image_widths[metadata_ix[u['name']]] = u['imageWidth']

        for k in metadata:
            metadata[k].append(image_widths.get(k, 80))


    with open(datadir + 'global_metadata.csv', 'w') as f:
        w = csv.writer(f)
        w.writerow('id, name, followers, tweets, screenname, imageWidth'.split(', '))
        for (k, v) in sorted(metadata.iteritems()):
            w.writerow([k] + v)

    # Global metadata only needs to get loaded once.
    # On the js side, just use queue.js and wait for username-min.csv and global_metadata.csv; 50% smaller


if __name__ == '__main__':
    main()
