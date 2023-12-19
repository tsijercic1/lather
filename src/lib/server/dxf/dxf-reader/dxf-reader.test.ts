import { expect, test } from 'vitest'
import { readDXFFile } from '$lib/server/dxf';

function getLibPath(): string {
	const libIndex = __dirname.indexOf('/lib')
	return __dirname.substring(0, libIndex + +4)
}

test('Read sample DXF file', () => {
	const examplePath: string = '/dxf-examples/example.dxf';
	const filePath = getLibPath() + examplePath;
	const dxfData = readDXFFile(filePath);
	expect(dxfData, "Must not be null").toBeTruthy();
})