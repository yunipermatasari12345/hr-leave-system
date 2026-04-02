package persistence

import (
	"context"
	"database/sql"
	"time"

	db "hr-leave-system/internal/db"
	"hr-leave-system/internal/domain/leave"
)

type leaveRepository struct {
	q *db.Queries
}

func NewLeaveRepository(raw *sql.DB) leave.Repository {
	return &leaveRepository{q: db.New(raw)}
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
	if l.AttachmentUrl.Valid {
		out.AttachmentURL = l.AttachmentUrl.String
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

func (r *leaveRepository) Create(ctx context.Context, employeeID, leaveTypeID int32, start, end time.Time, totalDays int32, reason, attachmentURL string) (leave.LeaveRequest, error) {
	row, err := r.q.CreateLeaveRequest(ctx, db.CreateLeaveRequestParams{
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
	})
	if err != nil {
		return leave.LeaveRequest{}, err
	}
	return leaveFromDB(row), nil
}

func (r *leaveRepository) ListByEmployee(ctx context.Context, employeeID int32) ([]leave.LeaveRequest, error) {
	rows, err := r.q.GetLeaveRequestsByEmployee(ctx, employeeID)
	if err != nil {
		return nil, err
	}
	out := make([]leave.LeaveRequest, len(rows))
	for i := range rows {
		out[i] = leaveFromDB(rows[i])
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
	return out, nil
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

func (r *leaveRepository) UpdateBalance(ctx context.Context, employeeID int32, leaveTypeID int32, year int32, daysUsed int32) error {
	_, err := r.q.UpdateLeaveBalance(ctx, db.UpdateLeaveBalanceParams{
		EmployeeID:  employeeID,
		UsedDays:    daysUsed,
		LeaveTypeID: leaveTypeID,
		Year:        year,
	})
	return err
}
