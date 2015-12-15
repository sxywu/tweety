#!/bin/bash
# Uses imagemagick's convert function (brew install imagemagick) to:
# 1) resize images to avoid transfering unnecessary data (big images, but shown small!)
# 2) normalize filetypes so we don't have to send users.json over the wire. Everything is screenname.jpg

for f in ../images/*
do
    if [ -f $f ] 
    then
         echo "Processing $f into ${f%.*}.jpg"
         # Resize all the images via imagemagick and make them small jpgs.
         convert $f -resize 200x200 -quality 80 -strip ${f%.*}.jpg
    fi
done

