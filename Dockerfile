FROM nodered/node-red:latest
EXPOSE 8080
CMD ["npm", "start", "--", "--userDir", "/data"]
