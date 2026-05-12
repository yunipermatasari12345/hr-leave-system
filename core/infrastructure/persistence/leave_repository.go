package persistence

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"time"

	db "hr-leave-system/core/db"
	"hr-leave-system/core/domain/leave"
)

type leaveRepository struct {
	q     *db.Queries
	rawDB *sql.DB
}

func NewLeaveRepository(raw *sql.DB) leave.Repository {
	return &leaveRepository{q: db.New(raw), rawDB: raw}
}

func leaveFromDB(l db.LeaveRequest) leave.LeaveRequest {
	out := leave.LeaveRequest{
		ID:          l.ID,
		EmployeeID:  l.EmployeeID,
		LeaveTypeID: l.LeaveTypeID,
		StartDate:   l.StartDate,
		EndDate:     l.EndDate,
		TotalDays:   l.TotalDays,
		Reason:      l.Reason,
		Status:      leave.Status(l.Status),
	}
	if len(l.AttachmentData) > 0 {
		out.HasBinaryAttachment = true
	}
	if l.AttachmentUrl.Valid {
		out.AttachmentURL = l.AttachmentUrl.String
	}
	if l.AttachmentFilename.Valid {
		out.AttachmentFilename = l.AttachmentFilename.String
	}
	if l.AttachmentContentType.Valid {
		out.AttachmentContentType = l.AttachmentContentType.String
	}
	if l.HrdNote.Valid {
		out.HrdNote = l.HrdNote.String
	}
	if l.ReviewedBy.Valid {
		out.ReviewedBy = l.ReviewedBy.Int32
	}
	if l.CreatedAt.Valid {
		out.CreatedAt = l.CreatedAt.Time
		out.HasCreatedAt = true
	}
	return out
}

func leaveFromEmployeeRow(r db.GetLeaveRequestsByEmployeeRow) leave.LeaveRequest {
	out := leave.LeaveRequest{
		ID:          r.ID,
		EmployeeID:  r.EmployeeID,
		LeaveTypeID: r.LeaveTypeID,
		StartDate:   r.StartDate,
		EndDate:     r.EndDate,
		TotalDays:   r.TotalDays,
		Reason:      r.Reason,
		Status:      leave.Status(r.Status),
	}
	if r.HasBinaryAttachment.Valid && r.HasBinaryAttachment.Bool {
		out.HasBinaryAttachment = true
	}
	if r.AttachmentUrl.Valid {
		out.AttachmentURL = r.AttachmentUrl.String
	}
	if r.AttachmentFilename.Valid {
		out.AttachmentFilename = r.AttachmentFilename.String
	}
	if r.AttachmentContentType.Valid {
		out.AttachmentContentType = r.AttachmentContentType.String
	}
	if r.HrdNote.Valid {
		out.HrdNote = r.HrdNote.String
	}
	if r.ReviewedBy.Valid {
		out.ReviewedBy = r.ReviewedBy.Int32
	}
	if r.CreatedAt.Valid {
		out.CreatedAt = r.CreatedAt.Time
		out.HasCreatedAt = true
	}
	return out
}

func attachHasBinary(nb sql.NullBool) bool {
	return nb.Valid && nb.Bool
}

func summaryFromAllRow(r db.GetAllLeaveRequestsRow) leave.RequestSummary {
	req := leave.LeaveRequest{
		ID:          r.ID,
		EmployeeID:  r.EmployeeID,
		LeaveTypeID: r.LeaveTypeID,
		StartDate:   r.StartDate,
		EndDate:     r.EndDate,
		TotalDays:   r.TotalDays,
		Reason:      r.Reason,
		Status:      leave.Status(r.Status),
	}
	if r.AttachmentUrl.Valid {
		req.AttachmentURL = r.AttachmentUrl.String
	}
	if attachHasBinary(r.HasBinaryAttachment) {
		req.HasBinaryAttachment = true
	}
	if r.HrdNote.Valid {
		req.HrdNote = r.HrdNote.String
	}
	if r.ReviewedBy.Valid {
		req.ReviewedBy = r.ReviewedBy.Int32
	}
	if r.CreatedAt.Valid {
		req.CreatedAt = r.CreatedAt.Time
		req.HasCreatedAt = true
	}
	return leave.RequestSummary{
		LeaveRequest:       req,
		EmployeeName:       r.EmployeeName,
		EmployeeDepartment: r.EmployeeDepartment,
		EmployeePosition:   r.EmployeePosition,
	}
}

func summaryFromAdvanced(r db.GetAdvancedLeavesRow) leave.RequestSummary {
	req := leave.LeaveRequest{
		ID:          r.ID,
		EmployeeID:  r.EmployeeID,
		LeaveTypeID: r.LeaveTypeID,
		StartDate:   r.StartDate,
		EndDate:     r.EndDate,
		TotalDays:   r.TotalDays,
		Reason:      r.Reason,
		Status:      leave.Status(r.Status),
	}
	if r.AttachmentUrl.Valid {
		req.AttachmentURL = r.AttachmentUrl.String
	}
	if attachHasBinary(r.HasBinaryAttachment) {
		req.HasBinaryAttachment = true
	}
	if r.HrdNote.Valid {
		req.HrdNote = r.HrdNote.String
	}
	if r.ReviewedBy.Valid {
		req.ReviewedBy = r.ReviewedBy.Int32
	}
	if r.CreatedAt.Valid {
		req.CreatedAt = r.CreatedAt.Time
		req.HasCreatedAt = true
	}
	return leave.RequestSummary{
		LeaveRequest:       req,
		EmployeeName:       r.EmployeeName,
		EmployeeDepartment: r.EmployeeDepartment,
		EmployeePosition:   r.EmployeePosition,
	}
}

func (r *leaveRepository) Create(ctx context.Context, employeeID, leaveTypeID int32, start, end time.Time, totalDays int32, reason, attachmentURL string, attachment *leave.AttachmentInput) (leave.LeaveRequest, error) {
	params := db.CreateLeaveRequestParams{
		EmployeeID:  employeeID,
		LeaveTypeID: leaveTypeID,
		StartDate:   start,
		EndDate:     end,
		TotalDays:   totalDays,
		Reason:      reason,
		AttachmentUrl: sql.NullString{
			String: attachmentURL,
			Valid:  attachmentURL != "",
		},
	}
	if attachment != nil && len(attachment.Data) > 0 {
		params.AttachmentData = attachment.Data
		params.AttachmentContentType = sql.NullString{String: attachment.ContentType, Valid: attachment.ContentType != ""}
		params.AttachmentFilename = sql.NullString{String: attachment.Filename, Valid: attachment.Filename != ""}
	}
	row, err := r.q.CreateLeaveRequest(ctx, params)
	if err != nil {
		log.Printf("DB ERROR [CreateLeaveRequest] for EmployeeID %d: %v", employeeID, err)
		return leave.LeaveRequest{}, fmt.Errorf("database gagal menyimpan pengajuan (ID: %d): %w", employeeID, err)
	}
	return leaveFromDB(row), nil
}

func (r *leaveRepository) GetAttachment(ctx context.Context, leaveID int32) ([]byte, string, string, int32, error) {
	row, err := r.q.GetLeaveAttachmentByID(ctx, leaveID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, "", "", 0, leave.ErrAttachmentNotFound
		}
		return nil, "", "", 0, err
	}
	if len(row.AttachmentData) == 0 {
		return nil, "", "", row.EmployeeID, leave.ErrAttachmentNotFound
	}
	ctype := "application/octet-stream"
	if row.AttachmentContentType.Valid && row.AttachmentContentType.String != "" {
		ctype = row.AttachmentContentType.String
	}
	fname := "lampiran"
	if row.AttachmentFilename.Valid && row.AttachmentFilename.String != "" {
		fname = row.AttachmentFilename.String
	}
	return row.AttachmentData, ctype, fname, row.EmployeeID, nil
}

func (r *leaveRepository) ListByEmployee(ctx context.Context, employeeID int32) ([]leave.LeaveRequest, error) {
	rows, err := r.q.GetLeaveRequestsByEmployee(ctx, employeeID)
	if err != nil {
		return nil, err
	}
	out := make([]leave.LeaveRequest, len(rows))
	for i := range rows {
		out[i] = leaveFromEmployeeRow(rows[i])
	}
	
	// Attach leave type name
	types, _ := r.ListLeaveTypes(ctx)
	typeMap := make(map[int32]string)
	for _, t := range types {
		typeMap[t.ID] = t.Name
	}
	for i := range out {
		if name, ok := typeMap[out[i].LeaveTypeID]; ok {
			out[i].LeaveTypeName = name
		}
	}

	return out, nil
}

func (r *leaveRepository) ListAllWithEmployee(ctx context.Context) ([]leave.RequestSummary, error) {
	rows, err := r.q.GetAllLeaveRequests(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]leave.RequestSummary, len(rows))
	for i := range rows {
		out[i] = summaryFromAllRow(rows[i])
	}
	return out, nil
}

func (r *leaveRepository) GetByID(ctx context.Context, id int32) (leave.LeaveRequest, error) {
	row, err := r.q.GetLeaveRequestByID(ctx, id)
	if err != nil {
		return leave.LeaveRequest{}, err
	}
	return leaveFromDB(row), nil
}

func (r *leaveRepository) UpdateStatus(ctx context.Context, id int32, status leave.Status, hrdNote string, reviewedByEmployeeID int32) (leave.LeaveRequest, error) {
	row, err := r.q.UpdateLeaveRequestStatus(ctx, db.UpdateLeaveRequestStatusParams{
		ID:     id,
		Status: string(status),
		HrdNote: sql.NullString{
			String: hrdNote,
			Valid:  hrdNote != "",
		},
		ReviewedBy: sql.NullInt32{
			Int32: reviewedByEmployeeID,
			Valid: reviewedByEmployeeID != 0,
		},
	})
	if err != nil {
		return leave.LeaveRequest{}, err
	}
	return leaveFromDB(row), nil
}

func (r *leaveRepository) ListLeaveTypes(ctx context.Context) ([]leave.LeaveType, error) {
	rows, err := r.q.GetAllLeaveTypes(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]leave.LeaveType, len(rows))
	for i := range rows {
		lt := leave.LeaveType{
			ID:      rows[i].ID,
			Name:    rows[i].Name,
			MaxDays: rows[i].MaxDays,
		}
		if rows[i].Description.Valid {
			lt.Description = rows[i].Description.String
		}
		out[i] = lt
	}
	return out, nil
}

func (r *leaveRepository) ListAdvanced(ctx context.Context, statusFilter, departmentFilter string) ([]leave.RequestSummary, error) {
	rows, err := r.q.GetAdvancedLeaves(ctx, db.GetAdvancedLeavesParams{
		Column1: statusFilter,
		Column2: departmentFilter,
	})
	if err != nil {
		return nil, err
	}
	out := make([]leave.RequestSummary, len(rows))
	for i := range rows {
		out[i] = summaryFromAdvanced(rows[i])
	}

	// Attach leave type name
	types, _ := r.ListLeaveTypes(ctx)
	typeMap := make(map[int32]string)
	for _, t := range types {
		typeMap[t.ID] = t.Name
	}
	for i := range out {
		if name, ok := typeMap[out[i].LeaveTypeID]; ok {
			out[i].LeaveTypeName = name
		}
	}

	return out, nil
}

func (r *leaveRepository) Delete(ctx context.Context, id int32) error {
	tx, err := r.rawDB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Ambil data pengajuan dulu untuk cek status (penting untuk log/audit jika perlu)
	var status string
	err = tx.QueryRowContext(ctx, `SELECT status FROM leave_requests WHERE id = $1`, id).Scan(&status)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil // Sudah tidak ada
		}
		return err
	}

	// 2. Hapus history (Riwayat pengajuan)
	_, err = tx.ExecContext(ctx, `DELETE FROM leave_histories WHERE leave_request_id = $1`, id)
	if err != nil {
		return fmt.Errorf("gagal menghapus riwayat: %w", err)
	}

	// 3. Hapus pengajuan utama
	_, err = tx.ExecContext(ctx, `DELETE FROM leave_requests WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("gagal menghapus pengajuan: %w", err)
	}

	return tx.Commit()
}

func (r *leaveRepository) GetBalance(ctx context.Context, employeeID int32, year int32) ([]leave.LeaveBalance, error) {
	rows, err := r.q.GetLeaveBalance(ctx, db.GetLeaveBalanceParams{
		EmployeeID: employeeID,
		Year:       year,
	})
	if err != nil {
		return nil, err
	}
	out := make([]leave.LeaveBalance, len(rows))
	for i, row := range rows {
		// Because LeaveTypeName is not fetched by GetLeaveBalance (it's select * from leave_balances),
		// we fetch the name or just do a quick lookup. For now we fetch types.
		// Or simpler: just populate what DB has.
		out[i] = leave.LeaveBalance{
			ID:            row.ID,
			EmployeeID:    row.EmployeeID,
			LeaveTypeID:   row.LeaveTypeID,
			Year:          row.Year,
			TotalDays:     row.TotalDays,
			UsedDays:      row.UsedDays,
			RemainingDays: row.RemainingDays,
		}
	}

	// We can manually attach leave type name if needed
	types, _ := r.ListLeaveTypes(ctx)
	typeMap := make(map[int32]string)
	for _, t := range types {
		typeMap[t.ID] = t.Name
	}
	for i := range out {
		if name, ok := typeMap[out[i].LeaveTypeID]; ok {
			out[i].LeaveTypeName = name
		}
	}

	return out, nil
}

func (r *leaveRepository) EnsureBalance(ctx context.Context, employeeID int32, leaveTypeID int32, year int32, totalDays int32) error {
	// Query to insert if NOT exists
	query := `
		INSERT INTO leave_balances (employee_id, leave_type_id, year, total_days, used_days, remaining_days)
		SELECT $1, $2, $3, $4, 0, $4
		WHERE NOT EXISTS (
			SELECT 1 FROM leave_balances 
			WHERE employee_id = $1 AND leave_type_id = $2 AND year = $3
		)
	`
	_, err := r.rawDB.ExecContext(ctx, query, employeeID, leaveTypeID, year, totalDays)
	return err
}

func (r *leaveRepository) UpdateBalance(ctx context.Context, employeeID int32, leaveTypeID int32, year int32, daysUsed int32) error {
	_, err := r.q.UpdateLeaveBalance(ctx, db.UpdateLeaveBalanceParams{
		EmployeeID:  employeeID,
		UsedDays:    daysUsed,
		LeaveTypeID: leaveTypeID,
		Year:        year,
	})
	return err
}

func (r *leaveRepository) CreateHistory(ctx context.Context, leaveRequestID int32, action string, hrdNote string, actorID int32) error {
	_, err := r.q.InsertLeaveHistory(ctx, db.InsertLeaveHistoryParams{
		LeaveRequestID: leaveRequestID,
		Action:         action,
		HrdNote: sql.NullString{
			String: hrdNote,
			Valid:  hrdNote != "",
		},
		ActorID: actorID,
	})
	return err
}

