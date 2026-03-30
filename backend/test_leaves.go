//go:build ignore

package main

import (
	"context"
	"fmt"
	"hr-leave-system/config"
	"hr-leave-system/internal/db"
	"log"
)

func main() {
	config.InitDB()
	q := db.New(config.DB)
	
	leaves, err := q.GetAdvancedLeaves(context.Background(), db.GetAdvancedLeavesParams{
		Column1: "",
		Column2: "",
	})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Fetched %d leaves\n", len(leaves))
	if len(leaves) > 0 {
		fmt.Printf("First leaf: %+v\n", leaves[0])
	}
}
