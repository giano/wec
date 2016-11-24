#!/bin/sh

# this script checks if the mongod is running, starts it if not

if pgrep -q mongod; then
    echo running;
else
    echo starting;
    mongod --fork --dbpath ./.data --logpath .pm2/mongodb.log;
fi
exit 0;
