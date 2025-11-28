// Resume builder - live preview + export to PDF (print) + JSON save
import templateHtml from ../templates/template.html?raw; 
  // This line is for bundlers; fallback used below

// Because we might not run a bundler here, we'll fetch the template instead:
async function getTemplate(){
  try{
    const res = await fetch('../templates/template.html');
    return await res.text();
  }catch(e){
    // fallback inline template if fetch fails (should rarely happen)
    return `<div class="resume">
      <h1 id="r_name"></h1>
      <div class="meta"><span id="r_title"></span><span id="r_contact"></span></div>
      <hr/>
      <section><h2>Summary</h2><div id="r_summary"></div></section>
      <section><h2>Experience</h2><div id="r_experience"></div></section>
      <section><h2>Education</h2><div id="r_education"></div></section>
      <section><h2>Skills</h2><div id="r_skills" class="skills"></div></section>
    </div>`;
  }
}

const previewArea = document.getElementById('previewArea');
const form = document.getElementById('resumeForm');
const saveJsonBtn = document.getElementById('saveJson');
const printBtn = document.getElementById('printBtn');

let TEMPLATE = '';

(async ()=>{
  TEMPLATE = await getTemplate();
  previewArea.innerHTML = TEMPLATE;
  // init with one experience and one education row
  addExp();
  addEdu();
  updatePreview();
})();

// dynamic fields
const expsContainer = document.getElementById('exps');
const edusContainer = document.getElementById('edus');

function createExpRow(data = {}){
  const div = document.createElement('div');
  div.className = 'item';
  div.innerHTML = `
    <div class="sectionRow">
      <input class="small" name="exp_title" placeholder="Job title (e.g. Frontend Developer)" value="${data.title||''}" />
      <input class="small" name="exp_company" placeholder="Company" value="${data.company||''}" />
      <button class="removeBtn">Remove</button>
    </div>
    <textarea name="exp_desc" rows="2" placeholder="Describe your responsibilities">${data.desc||''}</textarea>
  `;
  div.querySelector('.removeBtn').addEventListener('click', ()=>{ div.remove(); updatePreview(); });
  // input listeners
  div.querySelectorAll('input,textarea').forEach(el => el.addEventListener('input', updatePreview));
  return div;
}
function addExp(data){ expsContainer.appendChild(createExpRow(data)); updatePreview(); }
document.getElementById('addExp').addEventListener('click', ()=> addExp());

function createEduRow(data = {}){
  const div = document.createElement('div');
  div.className = 'item';
  div.innerHTML = `
    <div class="sectionRow">
      <input class="small" name="edu_degree" placeholder="Degree (e.g. B.Tech)" value="${data.degree||''}" />
      <input class="small" name="edu_inst" placeholder="Institution" value="${data.institution||''}" />
      <button class="removeBtn">Remove</button>
    </div>
    <div><input name="edu_year" placeholder="Year or duration" value="${data.year||''}" /></div>
  `;
  div.querySelector('.removeBtn').addEventListener('click', ()=>{ div.remove(); updatePreview(); });
  div.querySelectorAll('input').forEach(el => el.addEventListener('input', updatePreview));
  return div;
}
function addEdu(data){ edusContainer.appendChild(createEduRow(data)); updatePreview(); }
document.getElementById('addEdu').addEventListener('click', ()=> addEdu());

// bind simple inputs
form.querySelectorAll('input[name], textarea').forEach(el=>{
  el.addEventListener('input', updatePreview);
});

// collect data from form
function collectData(){
  const fd = new FormData(form);
  const data = {
    name: fd.get('name') || '',
    title: fd.get('title') || '',
    email: fd.get('email') || '',
    phone: fd.get('phone') || '',
    location: fd.get('location') || '',
    summary: fd.get('summary') || '',
    skills: (fd.get('skills') || '').split(',').map(s=>s.trim()).filter(Boolean),
    experience: [],
    education: []
  };
  // experience rows
  expsContainer.querySelectorAll('.item').forEach(item=>{
    const t = item.querySelector('input[name="exp_title"]').value;
    const c = item.querySelector('input[name="exp_company"]').value;
    const d = item.querySelector('textarea[name="exp_desc"]').value;
    if(t || c || d) data.experience.push({title:t, company:c, desc:d});
  });
  // education rows
  edusContainer.querySelectorAll('.item').forEach(item=>{
    const deg = item.querySelector('input[name="edu_degree"]').value;
    const inst = item.querySelector('input[name="edu_inst"]').value;
    const yr = item.querySelector('input[name="edu_year"]').value;
    if(deg || inst || yr) data.education.push({degree:deg, institution:inst, year:yr});
  });
  return data;
}

function updatePreview(){
  const data = collectData();
  // render into TEMPLATE DOM nodes inside previewArea
  const root = previewArea;
  root.innerHTML = TEMPLATE; // reset
  root.querySelector('#r_name').textContent = data.name || 'Your Name';
  root.querySelector('#r_title').textContent = data.title || '';
  root.querySelector('#r_contact').textContent = `${data.email || ''} ${data.phone ? ' • ' + data.phone : ''} ${data.location ? ' • ' + data.location : ''}`;

  root.querySelector('#r_summary').textContent = data.summary || '';

  const rExp = root.querySelector('#r_experience');
  rExp.innerHTML = '';
  data.experience.forEach(e=>{
    const div = document.createElement('div');
    div.innerHTML = `<strong>${e.title} — ${e.company}</strong><div>${e.desc}</div>`;
    rExp.appendChild(div);
  });

  const rEdu = root.querySelector('#r_education');
  rEdu.innerHTML = '';
  data.education.forEach(e=>{
    const div = document.createElement('div');
    div.innerHTML = `<strong>${e.degree} — ${e.institution}</strong><div>${e.year || ''}</div>`;
    rEdu.appendChild(div);
  });

  const rSkills = root.querySelector('#r_skills');
  rSkills.innerHTML = '';
  data.skills.forEach(s=>{
    const sp = document.createElement('div');
    sp.className = 'skill';
    sp.textContent = s;
    rSkills.appendChild(sp);
  });
}

// save JSON
saveJsonBtn.addEventListener('click', ()=>{
  const data = collectData();
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(data.name||'resume').replace(/\s+/g,'_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// print (export to PDF)
printBtn.addEventListener('click', ()=>{
  // open new window with the preview content styled for print
  const html = `
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Resume</title>
    <style>
      body{font-family: Arial, Helvetica, sans-serif;padding:24px;color:#111}
      h1{margin:0}
      .meta{color:#555;margin-bottom:8px}
      section{margin-top:12px}
      .skills{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}
      .skill{background:#eef2ff;color:#1e3a8a;padding:6px 8px;border-radius:8px}
    </style>
  </head>
  <body>${previewArea.innerHTML}</body>
  </html>
  `;
  const w = window.open('', '_blank', 'width=900,height=1000');
  w.document.open();
  w.document.write(html);
  w.document.close();
  // give the new window a short time to render then call print
  setTimeout(()=> w.print(), 300);
});
