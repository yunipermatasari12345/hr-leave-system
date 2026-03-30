package leave

import "errors"

var (
	ErrInvalidDateRange = errors.New("rentang tanggal tidak valid")
	ErrInvalidDecision  = errors.New("keputusan harus approved atau rejected")
)
