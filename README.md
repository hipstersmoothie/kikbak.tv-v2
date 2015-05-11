# WonderVid

An automatically generated music video top 100 of the web.

## Building

Make sure you have node, mongodb, and meteor installed

```shell
node -v
mongo --version
meteor --version
```

Once everything is installed, open two terminal tabs for the project.

To start database, go to /Server:
```shell
mongod
```
To start server go to /Server: (starts on localHost:4000)
```shell
gulp
```

To start client got to WonderVidClient: (starts on localHost:3000)
```shell
meteor
```

Navigate to http://localhost:3000/videosList to see the first 20 videos.
GET http://localhost:3000/videos for full list