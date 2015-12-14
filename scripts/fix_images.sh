#!/bin/bash
# Uses imagemagick's convert function (brew install imagemagick) to:
# 1) resize images to avoid transfering unnecessary data (big images, but shown small!)
# 2) normalize filetypes so we don't have to send users.json over the wire. Everything is screenname.jpg

for f in ../images/*
do
 echo "Processing $f into ${f%.*}.jpg"
 # Resize all the images to 100px via imagemagick and make them small jpgs.
 convert $f -resize 100x100 -quality 86 -strip ${f%.*}.jpg
done

# tuzki4 was an animated gif; have a bunch of frames extracted.
mv ../images/tuzki4-0.jpg images/tuzki4.jpg
rm ../images/tuzki4-*
