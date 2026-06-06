import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";
import type { StudySession, Exam, Subject, EnvironmentReading, User, Group } from "./types";

export type { StudySession, Exam, Subject, EnvironmentReading, User, Group };
export { SUBJECTS } from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "study_data.xlsx");

async function getWorkbook(): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  if (fs.existsSync(DATA_PATH)) {
    await wb.xlsx.readFile(DATA_PATH);
  }
  return wb;
}

function cellText(v: ExcelJS.CellValue): string {
  if (v == null) return '';
  if (typeof v === 'object' && 'richText' in (v as object)) {
    return (v as ExcelJS.CellRichTextValue).richText.map((r) => r.text).join('');
  }
  return String(v);
}

function ensureSheet(
  wb: ExcelJS.Workbook,
  name: string,
  headers: string[],
): ExcelJS.Worksheet {
  let ws = wb.getWorksheet(name);
  if (!ws) {
    ws = wb.addWorksheet(name);
    ws.addRow(headers);
    ws.getRow(1).font = { bold: true };
  }
  return ws;
}

async function saveWorkbook(wb: ExcelJS.Workbook) {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await wb.xlsx.writeFile(DATA_PATH);
}

// ── StudySessions ──────────────────────────────────────────────

export async function getStudySessions(studentId?: string): Promise<StudySession[]> {
  const wb = await getWorkbook();
  const ws = wb.getWorksheet("StudySessions");
  if (!ws) return [];
  const rows: StudySession[] = [];
  ws.eachRow((row, i) => {
    if (i === 1) return;
    const v = row.values as ExcelJS.CellValue[];
    const rowStudentId = v[7] ? String(v[7]).trim() : '';
    if (studentId && rowStudentId !== studentId) return;
    rows.push({
      id: String(v[1] ?? ""),
      subject: String(v[2] ?? "") as Subject,
      startTime: cellText(v[3]),
      endTime: cellText(v[4]),
      durationMinutes: Number(v[5] ?? 0),
      focusScore: Number(v[6] ?? 0),
      studentId: rowStudentId,
    });
  });
  return rows;
}

export async function addStudySession(
  data: Omit<StudySession, "id">,
): Promise<StudySession> {
  const wb = await getWorkbook();
  const ws = ensureSheet(wb, "StudySessions", [
    "id",
    "subject",
    "startTime",
    "endTime",
    "durationMinutes",
    "focusScore",
    "studentId",
  ]);
  const id = Date.now().toString();
  ws.addRow([id, data.subject, data.startTime, data.endTime, data.durationMinutes, data.focusScore, data.studentId ?? '']);
  await saveWorkbook(wb);
  return { id, ...data };
}

// ── Exams ──────────────────────────────────────────────────────

export async function getExams(studentId?: string): Promise<Exam[]> {
  const wb = await getWorkbook();
  const ws = wb.getWorksheet("Exams");
  if (!ws) return [];
  const rows: Exam[] = [];
  ws.eachRow((row, i) => {
    if (i === 1) return;
    const v = row.values as ExcelJS.CellValue[];
    const rowStudentId = v[7] ? String(v[7]).trim() : '';
    if (studentId && rowStudentId !== studentId) return;
    rows.push({
      id: String(v[1] ?? ""),
      examDate: String(v[2] ?? ""),
      examName: String(v[3] ?? ""),
      subject: String(v[4] ?? "") as Subject,
      myScore: v[5] != null ? Number(v[5]) : null,
      averageScore: v[6] != null ? Number(v[6]) : null,
    });
  });
  return rows;
}

export async function addExam(data: Omit<Exam, "id">): Promise<Exam> {
  const wb = await getWorkbook();
  const ws = ensureSheet(wb, "Exams", [
    "id",
    "examDate",
    "examName",
    "subject",
    "myScore",
    "averageScore",
    "studentId",
  ]);
  const id = Date.now().toString();
  ws.addRow([id, data.examDate, data.examName, data.subject, data.myScore, data.averageScore, data.studentId ?? '']);
  await saveWorkbook(wb);
  return { id, ...data };
}

export async function deleteExam(id: string): Promise<boolean> {
  const wb = await getWorkbook();
  const ws = wb.getWorksheet("Exams");
  if (!ws) return false;
  const headers = ["id", "examDate", "examName", "subject", "myScore", "averageScore", "studentId"];
  const kept: ExcelJS.CellValue[][] = [];
  let found = false;
  ws.eachRow((row, i) => {
    if (i === 1) return;
    const v = row.values as ExcelJS.CellValue[];
    if (String(v[1]) === id) { found = true; return; }
    kept.push(v.slice(1));
  });
  if (!found) return false;
  wb.removeWorksheet(ws.id);
  const newWs = wb.addWorksheet("Exams");
  newWs.addRow(headers).font = { bold: true };
  for (const row of kept) newWs.addRow(row);
  await saveWorkbook(wb);
  return true;
}

// ── Environment ────────────────────────────────────────────────

export async function getEnvironmentReadings(): Promise<EnvironmentReading[]> {
  const wb = await getWorkbook();
  const ws = wb.getWorksheet("Environment");
  if (!ws) return [];
  const rows: EnvironmentReading[] = [];
  ws.eachRow((row, i) => {
    if (i === 1) return;
    const v = row.values as ExcelJS.CellValue[];
    rows.push({
      date: String(v[1] ?? ""),
      temperature: Number(v[2] ?? 0),
      humidity: Number(v[3] ?? 0),
      brightness: Number(v[4] ?? 0),
    });
  });
  return rows;
}

// ── Users ──────────────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  const wb = await getWorkbook();
  const ws = wb.getWorksheet('Users');
  if (!ws) return [];
  const rows: User[] = [];
  ws.eachRow((row, i) => {
    if (i === 1) return;
    const v = row.values as ExcelJS.CellValue[];
    rows.push({
      studentId: String(v[1] ?? ''),
      password: String(v[2] ?? ''),
    });
  });
  return rows;
}

export async function getUserByStudentId(studentId: string): Promise<User | null> {
  const users = await getUsers();
  return users.find((u) => u.studentId === studentId) ?? null;
}

export async function addUser(data: { studentId: string; password: string }): Promise<User> {
  const wb = await getWorkbook();
  const ws = ensureSheet(wb, 'Users', ['studentId', 'password']);
  ws.addRow([data.studentId, data.password]);
  await saveWorkbook(wb);
  return data;
}

// ── Groups ─────────────────────────────────────────────────────

function parseMembers(raw: string): string[] {
  return raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
}

export async function getGroups(): Promise<Group[]> {
  const wb = await getWorkbook();
  const ws = wb.getWorksheet('Groups');
  if (!ws) return [];
  const rows: Group[] = [];
  ws.eachRow((row, i) => {
    if (i === 1) return;
    const v = row.values as ExcelJS.CellValue[];
    rows.push({
      groupId: cellText(v[1]),
      name: cellText(v[2]),
      createdBy: cellText(v[3]),
      members: parseMembers(cellText(v[4])),
    });
  });
  return rows;
}

export async function getGroupById(groupId: string): Promise<Group | null> {
  const groups = await getGroups();
  return groups.find((g) => g.groupId === groupId) ?? null;
}

function generateGroupId(existing: Set<string>): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  do {
    id = '';
    for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  } while (existing.has(id));
  return id;
}

export async function addGroup(data: { name: string; createdBy: string }): Promise<Group> {
  const wb = await getWorkbook();
  const ws = ensureSheet(wb, 'Groups', ['groupId', 'name', 'createdBy', 'members']);
  const existing = new Set<string>();
  ws.eachRow((row, i) => {
    if (i === 1) return;
    existing.add(cellText((row.values as ExcelJS.CellValue[])[1]));
  });
  const groupId = generateGroupId(existing);
  ws.addRow([groupId, data.name, data.createdBy, data.createdBy]);
  await saveWorkbook(wb);
  return { groupId, name: data.name, createdBy: data.createdBy, members: [data.createdBy] };
}

export async function joinGroup(groupId: string, studentId: string): Promise<Group | null> {
  const wb = await getWorkbook();
  const ws = wb.getWorksheet('Groups');
  if (!ws) return null;
  let result: Group | null = null;
  ws.eachRow((row, i) => {
    if (i === 1) return;
    const v = row.values as ExcelJS.CellValue[];
    if (cellText(v[1]) === groupId) {
      const members = parseMembers(cellText(v[4]));
      if (!members.includes(studentId)) {
        members.push(studentId);
        row.getCell(4).value = members.join(',');
      }
      result = {
        groupId: cellText(v[1]),
        name: cellText(v[2]),
        createdBy: cellText(v[3]),
        members,
      };
    }
  });
  if (result) await saveWorkbook(wb);
  return result;
}

export async function leaveGroup(groupId: string, studentId: string): Promise<{ dissolved: boolean }> {
  const wb = await getWorkbook();
  const ws = wb.getWorksheet('Groups');
  if (!ws) return { dissolved: false };
  let dissolved = false;
  const headers = ['groupId', 'name', 'createdBy', 'members'];
  const kept: ExcelJS.CellValue[][] = [];
  ws.eachRow((row, i) => {
    if (i === 1) return;
    const v = row.values as ExcelJS.CellValue[];
    if (cellText(v[1]) !== groupId) {
      kept.push(v.slice(1));
      return;
    }
    const createdBy = cellText(v[3]);
    if (createdBy === studentId) {
      dissolved = true;
    } else {
      const members = parseMembers(cellText(v[4])).filter((m) => m !== studentId);
      kept.push([cellText(v[1]), cellText(v[2]), createdBy, members.join(',')]);
    }
  });
  wb.removeWorksheet(ws.id);
  const newWs = wb.addWorksheet('Groups');
  newWs.addRow(headers).font = { bold: true };
  for (const row of kept) newWs.addRow(row);
  await saveWorkbook(wb);
  return { dissolved };
}

export async function updateExam(
  id: string,
  data: Partial<Omit<Exam, "id">>,
): Promise<Exam | null> {
  const wb = await getWorkbook();
  const ws = wb.getWorksheet("Exams");
  if (!ws) return null;
  let updated: Exam | null = null;
  ws.eachRow((row, i) => {
    if (i === 1) return;
    const v = row.values as ExcelJS.CellValue[];
    if (String(v[1]) === id) {
      if (data.examDate != null) row.getCell(2).value = data.examDate;
      if (data.examName != null) row.getCell(3).value = data.examName;
      if (data.subject != null) row.getCell(4).value = data.subject;
      if (data.myScore !== undefined) row.getCell(5).value = data.myScore;
      if (data.averageScore !== undefined) row.getCell(6).value = data.averageScore;
      updated = {
        id,
        examDate: String(row.getCell(2).value ?? ""),
        examName: String(row.getCell(3).value ?? ""),
        subject: String(row.getCell(4).value ?? "") as Subject,
        myScore: row.getCell(5).value != null ? Number(row.getCell(5).value) : null,
        averageScore: row.getCell(6).value != null ? Number(row.getCell(6).value) : null,
        studentId: row.getCell(7).value != null ? String(row.getCell(7).value) : '',
      };
    }
  });
  await saveWorkbook(wb);
  return updated;
}
