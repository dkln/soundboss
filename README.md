# Distributed Soundboss

A distributed soundboard, using websockets!

Anyone with this webpage open will be able to spam others by playing short sound clips.

![screenshot](https://github.com/dkln/soundboss/raw/master/screenshot.png)

## Getting started

Start the server:

    ./script/server

Go to http://localhost:3000/

## Development

Run `guard` to automatically compile coffeescripts.

## Sounds

To add sounds to the soundboard, create MP3 and Ogg Vorbis versions of your sample,
and put these in the `./public/audio` folder.
Make sure to remove leading/trailing silence and normalize the volume so it's not too 
loud or soft compared to the other sounds.

Next, add a single line to the `<ul>` list in the `./public/index.html` file, with
a `data-file` corresponding to the files you created.

For example, to add a 'cool-whip' sample, create `cool-whip.mp3` and `cool-whip.ogg`
files, add them to `./public/audio`, and add the following line in `index.html`:

``` html
<li data-file='cool-whip'>COOL WHIP</li>
```

To convert a sound to both `.ogg` and `.mp3`, run:

    ./script/convert /path/to/sound.wav

To add multiple versions of a sample, add a numeric suffix to the filenames
(e.g. `jobs1.ogg`, `jobs2.ogg`, etc.), and add a `data-versions` attribute with the
number of files to the HTML entry:

``` html
<li data-file='jobs' data-versions='11'>THEY TOOK'R JUBS</li>
```

A random sound will be played for every listener.

### Audio tools

Some tools to use:

* [Audacity](http://audacity.sourceforge.net/download/) (free audio editor)
* [YouTube mp3](http://youtube-mp3.org) (to download the audio of YouTube movies)

