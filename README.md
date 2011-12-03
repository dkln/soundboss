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

      <li rel='cool-whip'>COOL WHIP</li>

### Audio tools

Some tools to use:

1. lame (command-line MP3 encoder)
  * `brew install lame`
  * `lame file.wav` will create a file `file.wav.mp3` (rename it to `file.mp3`)
2. vorbis-tools (command-line Ogg Vorbis encoder)
  * `brew install vorbis-tools`
  * `oggenc file.wav` will create file `file.ogg`
3. Audacity (free audio editor)
  * http://audacity.sourceforge.net/download/
4. YouTube mp3 (to download the audio of YouTube movies)
  * http://youtube-mp3.org

