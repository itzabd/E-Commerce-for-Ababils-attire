export function convertToCSV(objArray: any[]) {
  if (!objArray || !objArray.length) {
    return '';
  }
  const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
  const headers = Object.keys(array[0]);
  let str = headers.join(',') + '\r\n';

  for (let i = 0; i < array.length; i++) {
    let line = '';
    for (let index in array[i]) {
      if (line !== '') line += ',';
      let val = array[i][index] !== null && array[i][index] !== undefined ? String(array[i][index]) : '';
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      line += val;
    }
    str += line + '\r\n';
  }
  return '\uFEFF' + str; // Add BOM for Excel compatibility
}

export function downloadFile(content: string, fileName: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
