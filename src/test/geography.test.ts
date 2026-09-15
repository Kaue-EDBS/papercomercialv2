import { describe, it, expect } from 'vitest';
import { parseSource } from '../features/ingestion/parser';
import { assertPublicConfig } from '../lib/public-config';
describe('source parser',()=>{
 it('preserves leading zeros and all other columns',()=>expect(parseSource('x.csv','COD_MUNICIPAL,CEP5,extra\n3550308,01001,abc')[0]).toEqual({COD_MUNICIPAL:'3550308',CEP5:'01001',extra:'abc'}));
 it('handles semicolon, quotes, CRLF and quoted newlines',()=>expect(parseSource('x.csv','COD_MUNICIPAL;nota\r\n3550308;"a;""b""\nc"')[0].nota).toBe('a;"b"\nc'));
 it('rejects duplicate headings',()=>expect(()=>parseSource('x.csv','CEP5,CEP5\n01001,01002')).toThrow());
 it('rejects mismatched column counts',()=>expect(()=>parseSource('x.csv','a,b\n1')).toThrow());
 it('rejects malformed quotes',()=>expect(()=>parseSource('x.csv','a,b\n1,"x')).toThrow());
 it('JSON preserves nested objects and numbers',()=>expect(parseSource('x.json','[{"COD_MUNICIPAL":"3550308","n":2,"nested":{"v":3}}]')[0].nested).toEqual({v:3}));
 it('rejects primitive JSON rows',()=>expect(()=>parseSource('x.json','[1]')).toThrow());
 it('rejects empty data',()=>expect(()=>parseSource('x.csv','a,b')).toThrow());
 it('accepts TSV and BOM',()=>expect(parseSource('x.tsv','\uFEFFCOD_MUNICIPAL\tCEP5\n3550308\t01001')[0].CEP5).toBe('01001'));
});
describe('browser configuration',()=>{
 it('rejects secrets',()=>expect(()=>assertPublicConfig('https://abc.supabase.co','sb_secret_test')).toThrow());
 it('rejects service_role JWT',()=>expect(()=>assertPublicConfig('https://abc.supabase.co',`x.${btoa(JSON.stringify({role:'service_role',ref:'abc'}))}.x`)).toThrow());
 it('accepts matching anon JWT',()=>expect(()=>assertPublicConfig('https://abc.supabase.co',`x.${btoa(JSON.stringify({role:'anon',ref:'abc'}))}.x`)).not.toThrow());
 it('rejects mismatched projects',()=>expect(()=>assertPublicConfig('https://abc.supabase.co',`x.${btoa(JSON.stringify({role:'anon',ref:'other'}))}.x`)).toThrow());
});
