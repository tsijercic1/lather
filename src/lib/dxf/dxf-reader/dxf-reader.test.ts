import { expect, test } from 'vitest'
import { parseDXF } from '$lib/dxf';
import fs from 'fs';

function getLibPath(): string {
	const libIndex = __dirname.indexOf('/lib')
	return __dirname.substring(0, libIndex + +4)
}

test('Read sample DXF file', () => {
	const examplePath: string = '/dxf-examples/example.dxf';
	const filePath = getLibPath() + examplePath;
	const fileContent = fs.readFileSync(filePath).toString();
	const dxfData = parseDXF(fileContent);
	expect(dxfData, "Must not be null").toBeTruthy();
})