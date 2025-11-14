/* global Chart */

const STORAGE_KEY = 'weight_fat_records';

function loadRecords() {
  const json = localStorage.getItem(STORAGE_KEY);
  return json ? JSON.parse(json) : [];
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function renderTable(records) {
  const tbody = document.querySelector('#dataTable tbody');
  tbody.innerHTML = '';

  records.sort((a,b)=>new Date(a.date)-new Date(b.date));

  for (const rec of records) {
    const tr=document.createElement('tr');
    tr.innerHTML=`<td class="px-4 py-2">${rec.date}</td>
      <td class="px-4 py-2 text-right">${rec.weight.toFixed(1)}</td>
      <td class="px-4 py-2 text-right">${rec.fat.toFixed(1)}</td>
      <td class="px-4 py-2"><button data-id="${rec.id}" class="editBtn btn bg-yellow-500 hover:bg-yellow-600 text-white">編集</button>
        <button data-id="${rec.id}" class="delBtn btn bg-red-400 hover:bg-red-500 text-white ml-1">削除</button></td>`;
    tbody.appendChild(tr);
  }
}

function updateChart(records) {
  const ctx = document.getElementById('weightFatChart').getContext('2d');
  const sorted=[...records].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const labels=sorted.map(r=>r.date);
  const weightData=sorted.map(r=>r.weight);
  const fatData=sorted.map(r=>r.fat);

  if (window.myChart) window.myChart.destroy();
  window.myChart = new Chart(ctx, {
    type:'line',
    data:{labels,datasets:[{
      label:'体重 (kg)',data:weightData,borderColor:'#10b981',backgroundColor:'rgba(16,185,129,0.1)',yAxisID:'y',tension:0.3,pointRadius:4},{
      label:'体脂肪率 (%)',data:fatData,borderColor:'#3b82f6',backgroundColor:'rgba(59,130,246,0.1)',yAxisID:'y1',tension:0.3,pointRadius:4}]
    },
    options:{responsive:true,interaction:{mode:'index',intersect:false},scales:{y:{title:{display:true,text:'体重 (kg)'}},y1:{position:'right',title:{display:true,text:'体脂肪率 (%)'}}}}
  });
}

document.getElementById('entryForm').addEventListener('submit',e=>{
  e.preventDefault();
  const date=document.getElementById('date').value;
  const weight=parseFloat(document.getElementById('weight').value);
  const fat=parseFloat(document.getElementById('fat').value);
  let records=loadRecords();
  const idx=records.findIndex(r=>r.id===date);
  if(idx!==-1){records[idx]={id:date,date,weight,fat};}else{records.push({id:date,date,weight,fat});}
  saveRecords(records);
  renderTable(records);
  updateChart(records);
  e.target.reset();
});

document.querySelector('#dataTable tbody').addEventListener('click',e=>{
  const btn=e.target.closest('button');
  if(!btn)return;
  const id=btn.dataset.id;
  let records=loadRecords();
  if(btn.classList.contains('delBtn')){
    records=records.filter(r=>r.id!==id);
    saveRecords(records);
    renderTable(records);
    updateChart(records);
  }else if(btn.classList.contains('editBtn')){
    const rec=records.find(r=>r.id===id);
    document.getElementById('date').value=rec.date;
    document.getElementById('weight').value=rec.weight;
    document.getElementById('fat').value=rec.fat;
  }
});

document.getElementById('clearAllBtn').addEventListener('click',()=>{
  if(!confirm('本当に全データを削除しますか？'))return;
  localStorage.removeItem(STORAGE_KEY);
  renderTable([]);
  updateChart([]);
});

// CSV Export and Import functionality

document.getElementById('exportCsvBtn').addEventListener('click', () => {
  const records = loadRecords();
  if (!records.length) { alert('保存されているデータがありません。'); return; }
  let csv = '日付,体重 (kg),体脂肪率 (%)\n';
  for (const r of records) {
    csv += `${r.date},${r.weight.toFixed(1)},${r.fat.toFixed(1)}\n`;
  }
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `weight_fat_records_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

document.getElementById('importCsvBtn').addEventListener('click', () => {
  const input = document.getElementById('importCsvInput');
  if (input) input.click();
});

document.getElementById('importCsvInput').addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      let text = e.target.result;
      text = text.replace(/^\uFEFF/, '');
      const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
      if (lines.length === 0) { alert('空のCSVです。'); return; }
      const hasHeader = /日付|date/i.test(lines[0]);
      let idx = 0;
      if (hasHeader) idx = 1;
      const records = loadRecords();
      for (; idx < lines.length; idx++) {
        const parts = lines[idx].split(',');
        if (parts.length < 3) continue;
        const date = parts[0].trim();
        const weight = parseFloat(parts[1]);
        const fat = parseFloat(parts[2]);
        if (!date || isNaN(weight) || isNaN(fat)) continue;
        const recIdx = records.findIndex(r => r.id === date);
        if (recIdx !== -1) {
          records[recIdx] = { id: date, date, weight, fat };
        } else {
          records.push({ id: date, date, weight, fat });
        }
      }
      saveRecords(records);
      renderTable(records);
      updateChart(records);
      alert('CSVをインポートしました。');
    } catch (err) {
      console.error(err);
      alert('CSVの読み込み中にエラーが発生しました。');
    }
  };
  reader.onerror = () => {
    alert('ファイルの読み込みに失敗しました。');
  };
  reader.readAsText(file, 'UTF-8');
  event.target.value = '';
});

const init=()=>{const records=loadRecords();renderTable(records);updateChart(records);};
window.addEventListener('load',init);
