FROM gregory90/nodejs:latest

ADD . /code

WORKDIR /code

CMD []
ENTRYPOINT ["/usr/local/bin/npm", "start"]

EXPOSE 3000

