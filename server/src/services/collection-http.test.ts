import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import jwt from 'jsonwebtoken';

test('real collection routes enforce auth and preserve public profiles', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'filmvault-http-'));
  Object.assign(process.env, { DB_DRIVER: 'sqlite', DB_PATH: path.join(dir,'test.sqlite'), DB_HOST:'127.0.0.1', DB_USER:'test', DB_NAME:'filmvault_test', JWT_SECRET:'disposable-test-key', OCI_PAR_URL:'' });
  const pool = (await import('../config/db')).default;
  const movies = (await import('../routes/movies')).default;
  const users = (await import('../routes/users')).default;
  await pool.query("INSERT INTO users (id,Usernames,Emails,Passwords) VALUES (1,'One','one@test.invalid','unused'),(2,'Two','two@test.invalid','unused')");
  for(let id=1;id<=18;id++) {
    await pool.query('INSERT INTO movies (id,tmdb_id,title) VALUES (?,?,?)',[id,1000+id,`Movie ${id}`]);
    await pool.query('INSERT INTO user_movies (user_id,movie_id) VALUES (1,?)',[id]);
  }
  await pool.query('INSERT INTO user_movies (user_id,movie_id) VALUES (2,1)');
  const app=express(); app.use('/api/movies',movies); app.use('/api/users',users);
  const server=app.listen(0,'127.0.0.1');
  await new Promise<void>(resolve=>server.once('listening',resolve));
  const port=(server.address() as any).port;
  const get=(url:string,user?:number)=>fetch(`http://127.0.0.1:${port}${url}`,{headers:user?{Authorization:`Bearer ${jwt.sign({id:user},process.env.JWT_SECRET!)}`}:{}});
  try {
    assert.equal((await get('/api/movies/user/list')).status,401);
    const first=await (await get('/api/movies/user/list?pagination=cursor',1)).json() as any;
    assert.equal(first.movies.length,15);assert.ok(first.nextCursor);
    const next=await (await get('/api/movies/user/list?pagination=cursor&cursor='+first.nextCursor,1)).json() as any;
    assert.equal(next.movies.length,3);assert.equal(next.nextCursor,null);
    assert.equal((await get('/api/movies/user/list?pagination=cursor&cursor='+first.nextCursor,2)).status,400);
    const own=await (await get('/api/movies/user/list?pagination=cursor&userId=1',2)).json() as any;
    assert.equal(own.movies.length,1);assert.equal(own.movies[0].MovieID,1001);
    const publicProfile=await (await get('/api/users/profile/1?pagination=cursor&limit=5')).json() as any;
    assert.equal(publicProfile.user.Usernames,'One');assert.equal(publicProfile.movies.length,5);
    assert.ok(publicProfile.nextCursor);assert.equal(publicProfile.user.Passwords,undefined);
    assert.equal((await get('/api/users/profile/999')).status,404);
    assert.equal((await get('/api/movies/user/list?pagination=cursor&limit=1000',1)).status,400);
    const member=await (await get('/api/movies/user/list?pagination=cursor&tmdbId=1001',1)).json() as any;
    assert.equal(member.movies.length,1);assert.equal(member.movies[0].MovieID,1001);
    const legacy = await (await get('/api/movies/user/list',1)).json() as any;
    assert.ok(Array.isArray(legacy)); assert.equal(legacy.length,18);
    const oldProfile = await (await get('/api/users/profile/1')).json() as any;
    assert.equal(oldProfile.movies.length,18); assert.equal(oldProfile.nextCursor,undefined);
    assert.equal((await get('/api/movies/user/list?pagination=unknown',1)).status,400);
  } finally {
    await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
    fs.rmSync(dir,{recursive:true,force:true});
  }
});
