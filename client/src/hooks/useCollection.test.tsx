import { act, renderHook, waitFor } from '@testing-library/react';
import axiosInstance from '../api/config';
import { useCollection } from './useCollection';
jest.mock('../api/config', () => ({ __esModule: true, default: { get: jest.fn() } }));
const get = axiosInstance.get as jest.Mock;
beforeEach(() => get.mockReset());
it('loads bounded pages, follows cursors, and resets whole-collection search', async () => {
  get.mockResolvedValueOnce({data:{movies:[{id:1}],nextCursor:'next'}})
    .mockResolvedValueOnce({data:{movies:[{id:2}],nextCursor:null}})
    .mockResolvedValueOnce({data:{movies:[{id:99}],nextCursor:null}});
  const {result,rerender}=renderHook(({q})=>useCollection('/collection','dateAdded','desc',q),{initialProps:{q:''}});
  await waitFor(()=>expect(result.current.loading).toBe(false));
  expect(get.mock.calls[0][1].params).toMatchObject({limit:15,cursor:''});
  act(()=>result.current.next());
  await waitFor(()=>expect(result.current.movies).toEqual([{id:2}]));
  expect(get.mock.calls[1][1].params.cursor).toBe('next');
  expect(result.current.page).toBe(2);
  rerender({q:'needle'});
  expect(result.current.movies).toEqual([]);
  await waitFor(()=>expect(result.current.movies).toEqual([{id:99}]));
  expect(result.current.page).toBe(1);
  expect(get.mock.calls[2][1].params).toMatchObject({q:'needle',cursor:''});
});
it('ignores a stale response and clears another user’s data immediately', async () => {
  let resolveOld: (value:any)=>void = ()=>{};
  get.mockImplementationOnce(()=>new Promise(resolve=>{resolveOld=resolve;}))
    .mockResolvedValueOnce({data:{user:{id:2},movies:[{id:2}],nextCursor:null}});
  const {result,rerender}=renderHook(({path})=>useCollection(path,'title','asc',''),{initialProps:{path:'/users/1'}});
  await waitFor(()=>expect(get).toHaveBeenCalledTimes(1));
  rerender({path:'/users/2'});
  expect(get.mock.calls[0][1].signal.aborted).toBe(true);
  await waitFor(()=>expect(result.current.user).toEqual({id:2}));
  await act(async()=>resolveOld({data:{user:{id:1},movies:[{id:1}],nextCursor:null}}));
  expect(result.current.movies).toEqual([{id:2}]);
});
it('exposes failures and retries without retaining misleading results', async () => {
  get.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({data:{movies:[],nextCursor:null}});
  const {result}=renderHook(()=>useCollection('/collection','title','asc',''));
  await waitFor(()=>expect(result.current.error).toBeTruthy());
  expect(result.current.loading).toBe(false);
  act(()=>result.current.reload());
  await waitFor(()=>expect(result.current.error).toBe(''));
  await waitFor(()=>expect(get).toHaveBeenCalledTimes(2));
  await waitFor(()=>expect(result.current.loading).toBe(false));
});
