require('dotenv').config();

import express from "express";
import { createConnection } from 'typeorm';
import passport from 'passport';
import * as ormConfig from '../ormconfig';
import bodyParser from 'body-parser';
import "reflect-metadata";

import ExpressSession from 'express-session';
import RedisStore from 'connect-redis';
import Redis from 'redis';

import AuthComplete from './middleware/AuthComplete';

//Import Strats
import GithubStrat from './Auth/Strategies/GithubStrat';

const RedisClient = Redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_POST
});
const RedisSession = RedisStore(ExpressSession);
const APIRoutes = require('./Api/routes');
const AuthRoutes = require('./Auth/Routes/AuthRoutes');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(ExpressSession({
  secret            : process.env.APP_SESSION,
  resave            : false,
  saveUninitialized : true,
  store: new RedisSession({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    client: RedisClient,
    ttl: 86400
  })
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
passport.use(GithubStrat());

createConnection(ormConfig).then(async (connection) => {
  app.get('/', (req: any, res) => {
      res.send('Base Route');
  });
  app.use('/login', AuthRoutes);
  app.use('/api/v1', AuthComplete,  APIRoutes);
  app.listen(5000, () => {
      console.log('Server Working');
  });
}).catch(err => {
  console.log(err);
});

module.exports = app;