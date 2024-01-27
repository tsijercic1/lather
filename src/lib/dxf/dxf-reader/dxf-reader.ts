import { DxfParser } from 'dxf-parser';

export default (content: string) => {
	const dxfParser = new DxfParser();
	return dxfParser.parseSync(content);
};
