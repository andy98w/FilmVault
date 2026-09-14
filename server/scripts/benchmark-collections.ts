import mysql from 'mysql2/promise';
import fs from 'node:fs';
import os from 'node:os';
import { performance } from 'node:perf_hooks';
import { collectionQuery, parseCollectionQuery, readCollection } from '../src/services/collection';
async function main() {
  if(process.env.DB_NAME!=='filmvault_test'||process.env.COLLECTION_TEST_MYSQL!=='1') throw new Error('Requires disposable filmvault_test database');
  const db=await mysql.createConnection({host:'127.0.0.1',user:'root',password:process.env.DB_PASSWORD,database:'filmvault_test',dateStrings:true});
  try {
    for(const table of ['movie_ratings','user_movies','movies','users']) await db.query(`DELETE FROM ${table}`);
    const sizes=[10,100,1000,10000];
    for(let u=1;u<=4;u++) await db.query('INSERT INTO users (id,Usernames,Emails,Passwords) VALUES (?,?,?,?)',[u,`fixture${u}`,`fixture${u}@test.invalid`,'unused']);
    for(let start=1;start<=10000;start+=500) await db.query('INSERT INTO movies (id,tmdb_id,title,poster_path,release_date,overview) VALUES ?',[Array.from({length:500},(_,i)=>[start+i,100000+start+i,`Movie ${String(start+i).padStart(5,'0')}`,`/poster-${start+i}.jpg`,'2020-01-01','Synthetic overview. '.repeat(25)])]);
    for(let u=1;u<=4;u++) for(let start=1;start<=sizes[u-1];start+=500) {
      const rows=Array.from({length:Math.min(500,sizes[u-1]-start+1)},(_,i)=>[u,start+i]);
      await db.query('INSERT INTO user_movies (user_id,movie_id) VALUES ?',[rows]);
      await db.query('INSERT INTO movie_ratings (user_id,movie_id,rating) VALUES ?',[rows.filter((_,i)=>i%2===0).map(row=>[...row,75])]);
    }
    await db.query('ANALYZE TABLE user_movies,movies,movie_ratings');
    const measure=async(run:()=>Promise<any>)=>{
      const start=performance.now();const first=await run();const firstRunMs=performance.now()-start;const times:number[]=[];
      for(let i=0;i<30;i++){const s=performance.now();await run();times.push(performance.now()-s);}times.sort((a,b)=>a-b);
      return {firstRunMs,warmP50Ms:times[14],warmP95Ms:times[28],responseBytes:Buffer.byteLength(JSON.stringify(first))};
    };
    const dto=(m:any)=>({MovieID:m.tmdb_id,Title:m.title,PosterPath:m.poster_path,Overview:m.overview,ReleaseDate:m.release_date,Rating:m.rating});
    const results=[];
    for(let user=1;user<=4;user++) {
      const sql='SELECT m.*,mr.rating FROM user_movies um JOIN movies m ON um.movie_id=m.id LEFT JOIN movie_ratings mr ON um.movie_id=mr.movie_id AND mr.user_id=? WHERE um.user_id=?';
      const options=parseCollectionQuery(user,{limit:'15'}), query=collectionQuery(user,options);
      const baseline=await measure(async()=>{const [rows]=await db.query(sql,[user,user]);return(rows as any[]).map(dto);});
      const paginated=await measure(async()=>{const p=await readCollection(db,user,options);return{...p,movies:p.movies.map(dto)};});
      const [baselinePlan]=await db.query('EXPLAIN ANALYZE '+sql,[user,user]);
      const [pagePlan]=await db.query('EXPLAIN ANALYZE '+query.sql,query.params);
      const [anchors]=await db.query('SELECT MIN(id) AS id FROM user_movies WHERE user_id=?',[user]);
      const anchor=(anchors as any[])[0].id+Math.floor(sizes[user-1]/2);
      const deepOptions={...options,after:{id:anchor,key:anchor}},deep=collectionQuery(user,deepOptions);
      const [deepPlan]=await db.query('EXPLAIN ANALYZE '+deep.sql,deep.params);
      const deepPage=await measure(()=>readCollection(db,user,deepOptions));
      results.push({collectionSize:sizes[user-1],baseline,paginated,deepPage,baselinePlan,pagePlan,deepPlan});
    }
    const [engine]=await db.query('SELECT VERSION() AS version'),[schema]=await db.query('SHOW CREATE TABLE user_movies'),[indexes]=await db.query('SHOW INDEX FROM user_movies');
    fs.mkdirSync('benchmark-results',{recursive:true});
    fs.writeFileSync('benchmark-results/collections.json',JSON.stringify({measuredAt:new Date().toISOString(),commit:process.env.GITHUB_SHA||'local',engine,host:{cpus:os.cpus().length,model:os.cpus()[0].model,memoryBytes:os.totalmem(),node:process.version},fixture:{movies:10000,memberships:11110,users:4,ratings:'50%',synthetic:true},notes:'Sequential local database calls including decoding and DTO construction, excluding HTTP/browser/TLS. First run is not cold-cache (seed and ANALYZE ran first). 30 warm iterations per variant. No production data.',schema,indexes,results},null,2));
  } finally {await db.end();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
