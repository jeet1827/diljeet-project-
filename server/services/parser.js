const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const detectFileType = (filename, mimetype) => {
  if (mimetype && ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(mimetype)) {
    return mimetype;
  }
  if (filename) {
    const ext = filename.toLowerCase().split('.').pop();
    if (ext === 'pdf') return 'application/pdf';
    if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (ext === 'txt') return 'text/plain';
  }
  return 'text/plain';
};

const parseFile = async (buffer, mimetype, filename = '') => {
  try {
    // Ensure buffer is a Buffer object
    if (!Buffer.isBuffer(buffer)) {
      console.error('Invalid buffer type:', typeof buffer, Buffer.isBuffer(buffer));
      throw new Error('File data must be a Buffer');
    }

    const fileType = detectFileType(filename, mimetype);
    console.log(`Parsing ${filename} as ${fileType}, buffer size: ${buffer.length}`);
    
    if (fileType === 'application/pdf') {
      const data = await pdfParse(buffer);
      return data.text || '';
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    } else {
      return buffer.toString('utf-8');
    }
  } catch (error) {
    console.error('Parse error:', error.message);
    throw error;
  }
};

module.exports = { parseFile };
