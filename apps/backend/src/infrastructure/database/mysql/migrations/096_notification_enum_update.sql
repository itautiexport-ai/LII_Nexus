ALTER TABLE notifications MODIFY COLUMN notification_type ENUM(
  'new_task_assigned','task_due_today','task_overdue','workflow_stage_assigned','workflow_approved',
  'workflow_rejected','delegation_assigned','checklist_missed','daily_dpr_pending','factory_delay',
  'machine_breakdown','crm_followup_due','crm_followup_missed','lead_assigned','lead_won','lead_lost',
  'executive_meeting_reminder',
  'delegation_extension_requested','delegation_extension_approved','delegation_extension_rejected'
) NOT NULL;
