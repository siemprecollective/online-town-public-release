# online-town

A prototype into the metaverse.

## Running

On the first load, run
```bash
npm install
```

Then go into the root directory, and
```bash
npm run build
npm run start-http
```

To run on `localhost:3000`. Each time you change files, you need to rebuild.

## Deploying

SSH into the server, and then run

```bash
tmux -S BLANK ls
tmux -S BLANK a -t [session_name]
```
CTRL+C on both
CTRL+B, left and right arrow to switch
git pull
up arrow to get previous command, enter

Look up tmux keybindings to use correctly, but basically ctrl+c both instances, git pull, and then restart both of them.
