import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("humanitarian.db");
db.pragma('foreign_keys = ON');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_code TEXT UNIQUE,
    dynamics_code TEXT UNIQUE,
    donor TEXT,
    consortium INTEGER,
    drc_is_lead INTEGER,
    title TEXT,
    country TEXT,
    regions TEXT, -- JSON array of RegionSectors
    sectors TEXT, -- JSON array
    partners TEXT, -- JSON array
    start_date TEXT,
    end_date TEXT,
    proposal_lead TEXT,
    technical_leads TEXT, -- JSON array
    dynamics_lead TEXT,
    submission_deadline TEXT,
    donor_currency TEXT,
    total_budget_donor REAL,
    status TEXT DEFAULT 'Pipeline', -- Pipeline, Active, Closed, Rejected
    beneficiaries TEXT,
    summary TEXT,
    principal_objective TEXT,
    specific_objectives TEXT,
    donor_compliance TEXT,
    has_partners INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    region TEXT,
    sector TEXT,
    outcome TEXT,
    output TEXT,
    output_target INTEGER,
    activity_proposal_name TEXT,
    activity_target INTEGER,
    activity_drc_name TEXT,
    current_progress INTEGER DEFAULT 0,
    beneficiaries_reached INTEGER DEFAULT 0,
    is_partner_implemented INTEGER DEFAULT 0,
    partner_name TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS installments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    date TEXT,
    amount REAL,
    status TEXT DEFAULT 'Scheduled', -- Scheduled, Received
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    type TEXT,
    deadline TEXT,
    status TEXT DEFAULT 'Triggered', -- Triggered, Sent, Approved, Not Approved
    is_drc_partner INTEGER,
    lead_person TEXT,
    technical_people TEXT, -- JSON array
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    date TEXT,
    time TEXT,
    type TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  );
`);

// Migration: Add missing columns if they don't exist
const tableInfoProjects = db.prepare("PRAGMA table_info(projects)").all() as any[];
const projectColumns = [
  { name: 'drc_is_lead', type: 'INTEGER DEFAULT 0' },
  { name: 'has_partners', type: 'INTEGER DEFAULT 0' },
  { name: 'beneficiaries', type: 'TEXT' },
  { name: 'summary', type: 'TEXT' },
  { name: 'principal_objective', type: 'TEXT' },
  { name: 'specific_objectives', type: 'TEXT' },
  { name: 'donor_compliance', type: 'TEXT' },
  { name: 'dynamics_code', type: 'TEXT' }
];

projectColumns.forEach(col => {
  if (!tableInfoProjects.find(c => c.name === col.name)) {
    db.exec(`ALTER TABLE projects ADD COLUMN ${col.name} ${col.type}`);
  }
});

const tableInfoActivities = db.prepare("PRAGMA table_info(activities)").all() as any[];
const activityColumns = [
  { name: 'is_partner_implemented', type: 'INTEGER DEFAULT 0' },
  { name: 'beneficiaries_reached', type: 'INTEGER DEFAULT 0' },
  { name: 'partner_name', type: 'TEXT' }
];
activityColumns.forEach(col => {
  if (!tableInfoActivities.find(c => c.name === col.name)) {
    db.exec(`ALTER TABLE activities ADD COLUMN ${col.name} ${col.type}`);
  }
});

const tableInfoInstallments = db.prepare("PRAGMA table_info(installments)").all() as any[];
if (!tableInfoInstallments.find(c => c.name === 'status')) {
  db.exec("ALTER TABLE installments ADD COLUMN status TEXT DEFAULT 'Scheduled'");
}

const tableInfoReports = db.prepare("PRAGMA table_info(reports)").all() as any[];
if (!tableInfoReports.find(c => c.name === 'status')) {
  db.exec("ALTER TABLE reports ADD COLUMN status TEXT DEFAULT 'Triggered'");
}

const clean = (val: any) => (val === '' || val === undefined ? null : val);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/projects", (req, res) => {
    const projects = db.prepare("SELECT * FROM projects ORDER BY created_at DESC").all();
    res.json(projects.map(p => {
      const activities = db.prepare("SELECT * FROM activities WHERE project_id = ?").all(p.id);
      const installments = db.prepare("SELECT * FROM installments WHERE project_id = ?").all(p.id);
      const reports = db.prepare("SELECT * FROM reports WHERE project_id = ?").all(p.id).map(r => ({
        ...r,
        technical_people: JSON.parse(r.technical_people || "[]")
      }));
      return {
        ...p,
        regions: JSON.parse(p.regions || "[]"),
        sectors: JSON.parse(p.sectors || "[]"),
        partners: JSON.parse(p.partners || "[]"),
        technical_leads: JSON.parse(p.technical_leads || "[]"),
        consortium: !!p.consortium,
        drc_is_lead: !!p.drc_is_lead,
        has_partners: !!p.has_partners,
        activities,
        installments,
        reports
      };
    }));
  });

  app.get("/api/projects/:id", (req, res) => {
    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    
    const activities = db.prepare("SELECT * FROM activities WHERE project_id = ?").all(req.params.id);
    const installments = db.prepare("SELECT * FROM installments WHERE project_id = ?").all(req.params.id);
    const reports = db.prepare("SELECT * FROM reports WHERE project_id = ?").all(req.params.id).map(r => ({
      ...r,
      technical_people: JSON.parse(r.technical_people || "[]")
    }));
    const meetings = db.prepare("SELECT * FROM meetings WHERE project_id = ?").all(req.params.id);

    res.json({
      ...project,
      regions: JSON.parse(project.regions || "[]"),
      sectors: JSON.parse(project.sectors || "[]"),
      partners: JSON.parse(project.partners || "[]"),
      technical_leads: JSON.parse(project.technical_leads || "[]"),
      consortium: !!project.consortium,
      drc_is_lead: !!project.drc_is_lead,
      has_partners: !!project.has_partners,
      activities,
      installments,
      reports,
      meetings
    });
  });

  app.post("/api/projects", (req, res) => {
    try {
      const {
        project_code, dynamics_code, donor, consortium, drc_is_lead, has_partners, title, country, regions, sectors, partners,
        start_date, end_date, proposal_lead, technical_leads, dynamics_lead,
        submission_deadline, donor_currency, total_budget_donor, status,
        beneficiaries, summary, principal_objective, specific_objectives, donor_compliance,
        activities, installments, reports
      } = req.body;

      const projectId = db.transaction(() => {
        const info = db.prepare(`
          INSERT INTO projects (
            project_code, dynamics_code, donor, consortium, drc_is_lead, has_partners, title, country, regions, sectors, partners,
            start_date, end_date, proposal_lead, technical_leads, dynamics_lead,
            submission_deadline, donor_currency, total_budget_donor, status,
            beneficiaries, summary, principal_objective, specific_objectives, donor_compliance
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          clean(project_code), clean(dynamics_code), donor, consortium ? 1 : 0, drc_is_lead ? 1 : 0, has_partners ? 1 : 0, title, country, JSON.stringify(regions || []),
          JSON.stringify(sectors || []), JSON.stringify(partners || []), start_date, end_date,
          proposal_lead, JSON.stringify(technical_leads || []), dynamics_lead,
          submission_deadline, donor_currency, total_budget_donor, status || 'Pipeline',
          beneficiaries, summary, principal_objective, specific_objectives, donor_compliance
        );

        const id = info.lastInsertRowid;

        if (activities) {
          const insertActivity = db.prepare(`
            INSERT INTO activities (project_id, region, sector, outcome, output, output_target, activity_proposal_name, activity_target, activity_drc_name, current_progress, beneficiaries_reached, is_partner_implemented, partner_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const act of activities) {
            insertActivity.run(id, act.region, act.sector, act.outcome, act.output, act.output_target, act.activity_proposal_name, act.activity_target, act.activity_drc_name, act.current_progress || 0, act.beneficiaries_reached || 0, act.is_partner_implemented ? 1 : 0, act.partner_name);
          }
        }

        if (installments) {
          const insertInstallment = db.prepare(`
            INSERT INTO installments (project_id, date, amount, status)
            VALUES (?, ?, ?, ?)
          `);
          for (const inst of installments) {
            insertInstallment.run(id, inst.date, inst.amount, inst.status || 'Scheduled');
          }
        }

        if (reports) {
          const insertReport = db.prepare(`
            INSERT INTO reports (project_id, type, deadline, status, is_drc_partner, lead_person, technical_people)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
          for (const rep of reports) {
            insertReport.run(id, rep.type, rep.deadline, rep.status || 'Triggered', rep.is_drc_partner ? 1 : 0, rep.lead_person, JSON.stringify(rep.technical_people || []));
          }
        }
        return id;
      })();

      res.json({ id: projectId, project_code });
    } catch (err) {
      console.error("Error creating project:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/projects/:id", (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      console.log(`Updating project ${projectId}`, req.body);
      
      const existingProject = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId);
      if (!existingProject) return res.status(404).json({ error: "Project not found" });

      const updates = req.body;
      
      // Merge existing data with updates
      const merged = {
        ...existingProject,
        ...updates,
        // Handle JSON fields specifically
        regions: updates.regions ? JSON.stringify(updates.regions) : existingProject.regions,
        sectors: updates.sectors ? JSON.stringify(updates.sectors) : existingProject.sectors,
        partners: updates.partners ? JSON.stringify(updates.partners) : existingProject.partners,
        technical_leads: updates.technical_leads ? JSON.stringify(updates.technical_leads) : existingProject.technical_leads,
        // Handle booleans
        consortium: updates.consortium !== undefined ? (updates.consortium ? 1 : 0) : existingProject.consortium,
        drc_is_lead: updates.drc_is_lead !== undefined ? (updates.drc_is_lead ? 1 : 0) : existingProject.drc_is_lead,
        has_partners: updates.has_partners !== undefined ? (updates.has_partners ? 1 : 0) : existingProject.has_partners
      };

      db.transaction(() => {
        try {
          db.prepare(`
            UPDATE projects SET
              project_code = ?, dynamics_code = ?, donor = ?, consortium = ?, drc_is_lead = ?, has_partners = ?, title = ?, country = ?, regions = ?, sectors = ?, partners = ?,
              start_date = ?, end_date = ?, proposal_lead = ?, technical_leads = ?, dynamics_lead = ?,
              submission_deadline = ?, donor_currency = ?, total_budget_donor = ?, status = ?,
              beneficiaries = ?, summary = ?, principal_objective = ?, specific_objectives = ?, donor_compliance = ?
            WHERE id = ?
          `).run(
            clean(merged.project_code), clean(merged.dynamics_code), merged.donor, merged.consortium, merged.drc_is_lead, merged.has_partners, merged.title, merged.country, merged.regions,
            merged.sectors, merged.partners, merged.start_date, merged.end_date,
            merged.proposal_lead, merged.technical_leads, merged.dynamics_lead,
            merged.submission_deadline, merged.donor_currency, merged.total_budget_donor, merged.status,
            merged.beneficiaries, merged.summary, merged.principal_objective, merged.specific_objectives, merged.donor_compliance,
            projectId
          );

          if (updates.activities) {
            db.prepare("DELETE FROM activities WHERE project_id = ?").run(projectId);
            const insertActivity = db.prepare(`
              INSERT INTO activities (project_id, region, sector, outcome, output, output_target, activity_proposal_name, activity_target, activity_drc_name, current_progress, beneficiaries_reached, is_partner_implemented, partner_name)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            for (const act of updates.activities) {
              insertActivity.run(projectId, act.region, act.sector, act.outcome, act.output, act.output_target, act.activity_proposal_name, act.activity_target, act.activity_drc_name, act.current_progress || 0, act.beneficiaries_reached || 0, act.is_partner_implemented ? 1 : 0, act.partner_name);
            }
          }

          if (updates.installments) {
            db.prepare("DELETE FROM installments WHERE project_id = ?").run(projectId);
            const insertInstallment = db.prepare(`
              INSERT INTO installments (project_id, date, amount, status)
              VALUES (?, ?, ?, ?)
            `);
            for (const inst of updates.installments) {
              insertInstallment.run(projectId, inst.date, inst.amount, inst.status || 'Scheduled');
            }
          }

          if (updates.reports) {
            db.prepare("DELETE FROM reports WHERE project_id = ?").run(projectId);
            const insertReport = db.prepare(`
              INSERT INTO reports (project_id, type, deadline, status, is_drc_partner, lead_person, technical_people)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            for (const rep of updates.reports) {
              insertReport.run(projectId, rep.type, rep.deadline, rep.status || 'Triggered', rep.is_drc_partner ? 1 : 0, rep.lead_person, JSON.stringify(rep.technical_people || []));
            }
          }
        } catch (dbErr) {
          console.error("Database error inside transaction:", dbErr);
          throw dbErr;
        }
      })();

      res.json({ success: true });
    } catch (err) {
      console.error("Error updating project:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/meetings", (req, res) => {
    const { project_id, date, time, type } = req.body;
    const info = db.prepare(`
      INSERT INTO meetings (project_id, date, time, type)
      VALUES (?, ?, ?, ?)
    `).run(project_id, date, time, type);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/meetings", (req, res) => {
    const meetings = db.prepare(`
      SELECT m.*, p.project_code, p.dynamics_code, p.title as project_title, p.sectors, p.regions, p.partners, p.end_date as project_end_date, p.status as project_status
      FROM meetings m
      JOIN projects p ON m.project_id = p.id
      ORDER BY m.date DESC, m.time DESC
    `).all();
    res.json(meetings.map(m => ({
      ...m,
      sectors: JSON.parse(m.sectors || "[]"),
      regions: JSON.parse(m.regions || "[]"),
      partners: JSON.parse(m.partners || "[]"),
    })));
  });

  app.get("/api/installments", (req, res) => {
    const installments = db.prepare(`
      SELECT i.*, p.project_code, p.dynamics_code, p.title as project_title
      FROM installments i
      JOIN projects p ON i.project_id = p.id
      ORDER BY i.date ASC
    `).all();
    res.json(installments);
  });

  app.get("/api/reports", (req, res) => {
    const reports = db.prepare(`
      SELECT r.*, p.project_code, p.dynamics_code, p.title as project_title
      FROM reports r
      JOIN projects p ON r.project_id = p.id
      ORDER BY r.deadline ASC
    `).all();
    res.json(reports.map(r => ({
      ...r,
      technical_people: JSON.parse(r.technical_people || "[]")
    })));
  });

  app.delete("/api/projects/:id", (req, res) => {
    db.prepare("DELETE FROM projects WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.patch("/api/installments/:id", (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE installments SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ success: true });
  });

  app.patch("/api/reports/:id", (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE reports SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
