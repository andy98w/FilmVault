import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { readCollection, parseCollectionQuery, CollectionInputError, Queryable } from './collection';
test('real-engine collection contract', async t => {
  let db: Queryable, close: () => Promise<void>;
  if (process.env.COLLECTION_TEST_MYSQL === '1') {
    assert.equal(process.env.DB_NAME,'filmvault_test');
    db = await (await import('mysql2/promise')).createConnection({host:'127.0.0.1',user:'root',password:process.env.DB_PASSWORD,database:'filmvault_test',dateStrings:true});
    close = () => (db as any).end();
    for(const table of ['movie_ratings','user_movies','movies','users']) await db.query(`DELETE FROM ${table}`);
  } else {
    const sqlite = new (require('node:sqlite').DatabaseSync)(':memory:');
    sqlite.exec(fs.readFileSync('src/config/db.ts','utf8').split('database.exec(`')[1].split('`);')[0]);
    db={query:async(sql,params=[])=>[/^SELECT/.test(sql)?sqlite.prepare(sql).all(...params):sqlite.prepare(sql).run(...params),[]]};
    close=async()=>sqlite.close();
  }
  try {
    await db.query("INSERT INTO users (id,Usernames,Emails,Passwords) VALUES (1,'one','one@test.invalid','unused'),(2,'two','two@test.invalid','unused')");
    for(let id=1;id<=31;id++) {
      await db.query('INSERT INTO movies (id,tmdb_id,title,release_date) VALUES (?,?,?,?)',[id,1000+id,id===31?'100%_literal':`Title ${id%4}`,id%3?'2020-01-01':null]);
      await db.query('INSERT INTO user_movies (id,user_id,movie_id) VALUES (?,1,?)',[id,id]);
      if(id%2) await db.query('INSERT INTO movie_ratings (user_id,movie_id,rating) VALUES (1,?,50)',[id]);
    }
    await db.query('INSERT INTO user_movies (id,user_id,movie_id) VALUES (32,2,1)');
    await db.query('INSERT INTO movie_ratings (user_id,movie_id,rating) VALUES (2,1,99)');
    const page=(q:Record<string,unknown>={},user=1)=>readCollection(db,user,parseCollectionQuery(user,q));
    await t.test('bounded pages, ties, final page, ownership and empty collection',async()=>{
      for(const sort of ['dateAdded','title','rating','releaseDate']) for(const direction of ['asc','desc']) {
        let cursor:string|null=null; const ids:number[]=[];
        do {const p=await page({sort,direction,limit:'7',...(cursor?{cursor}:{})});assert.ok(p.movies.length<=7);ids.push(...p.movies.map((m:any)=>m.id));cursor=p.nextCursor;} while(cursor);
        assert.equal(ids.length,31);assert.equal(new Set(ids).size,31);
        if(sort==='dateAdded') assert.deepEqual(ids,Array.from({length:31},(_,i)=>direction==='asc'?i+1:31-i));
      }
      assert.deepEqual(await page({},99),{movies:[],nextCursor:null});
      assert.equal((await page({},2)).movies[0].rating,99);
      assert.equal((await page({tmdbId:'1001'})).movies[0].rating,50);
    });
    await t.test('search covers collection and treats wildcards literally; membership is bounded',async()=>{
      assert.deepEqual((await page({q:'%_'})).movies.map((m:any)=>m.id),[31]);
      assert.deepEqual((await page({tmdbId:'1001'})).movies.map((m:any)=>m.id),[1]);
      assert.equal((await page({tmdbId:'99999'})).movies.length,0);
    });
    await t.test('reject invalid input and cross-user or changed-query cursors',async()=>{
      for(const q of [{limit:'101'},{limit:'0'},{limit:['10']},{sort:'__proto__'},{direction:'DROP'},{cursor:'bad'},{q:'x'.repeat(201)},{tmdbId:'-1'}]) assert.throws(()=>parseCollectionQuery(1,q),CollectionInputError);
      const p=await page({limit:'5'});
      assert.throws(()=>parseCollectionQuery(2,{cursor:p.nextCursor}),CollectionInputError);
      assert.throws(()=>parseCollectionQuery(1,{cursor:p.nextCursor,q:'different'}),CollectionInputError);
      assert.throws(()=>parseCollectionQuery(1,{cursor:p.nextCursor,sort:'rating'}),CollectionInputError);
    });
    await t.test('new insert and deleted anchor do not shift descending continuation',async()=>{
      const p=await page({limit:'5'});
      await db.query('DELETE FROM user_movies WHERE user_id=1 AND movie_id=27');
      await db.query("INSERT INTO movies (id,tmdb_id,title) VALUES (40,1040,'New')");
      await db.query('INSERT INTO user_movies (id,user_id,movie_id) VALUES (40,1,40)');
      assert.deepEqual((await page({limit:'5',cursor:p.nextCursor})).movies.map((m:any)=>m.id),[26,25,24,23,22]);
      assert.equal((await page()).movies[0].id,40);
    });
    await t.test('unique constraints prevent join fan-out',async()=>{
      await assert.rejects(db.query('INSERT INTO movie_ratings (user_id,movie_id,rating) VALUES (1,1,75)'));
      await assert.rejects(db.query('INSERT INTO user_movies (user_id,movie_id) VALUES (1,1)'));
    });
  } finally {await close();}
});
