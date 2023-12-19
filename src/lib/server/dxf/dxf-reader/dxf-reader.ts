import { DxfParser } from 'dxf-parser';
import fs from 'fs';

export default (filePath: string) => {
	const fileContent = fs.readFileSync(filePath).toString();
	const dxfParser = new DxfParser();
	return dxfParser.parseSync(fileContent.toString());
};
