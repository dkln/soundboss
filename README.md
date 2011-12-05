# Distributed Soundboss

A distributed soundboard, using websockets!

Anyone with this webpage open will be able to spam others by playing short sound clips.

![screenshot](https://github.com/dkln/soundboss/raw/master/screenshot.jpg)

## Getting started

Start the server:

    ./script/server

Go to http://localhost:3000/

## Development

Run `guard` to automatically compile coffeescripts.

## Sounds

To add sounds to the soundboard, create MP3 and Ogg Vorbis versions of your sample,
and put these in the `./public/audio` folder.

Next, add a single line to the `<ul>` list in the `./public/index.html` file, with
a `rel` corresponding to the files you created.

For example, to add a 'cool-whip' sample, create `cool-whip.mp3` and `cool-whip.ogg`
files, add them to `./public/audio`, and add the following line in `index.html`:

``` html
<li rel='cool-whip'>COOL WHIP</li>
```

To convert a sound to both `.ogg` and `.mp3`, run:

    ./script/convert /path/to/sound.wav

### Audio tools

Some tools to use:

* [Audacity](http://audacity.sourceforge.net/download/) (free audio editor)
* [YouTube mp3](http://youtube-mp3.org) (to download the audio of YouTube movies)