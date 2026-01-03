import fse from 'fs-extra';
import path from 'path';
const topDir = import.meta.dirname;
fse.emptyDirSync(path.join(topDir, 'public', 'tinymce'));
fse.copySync(path.join(topDir, 'node_modules', 'tinymce'), path.join(topDir, 'public', 'tinymce'), { overwrite: true });
// Only when using tinymce-premium plugins
// fse.emptyDirSync(path.join(topDir, 'public', 'tinymce-premium'));
// fse.copySync(path.join(topDir, 'node_modules', 'tinymce-premium'), path.join(topDir, 'public', 'tinymce-premium'), { overwrite: true });
