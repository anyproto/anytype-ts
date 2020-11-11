package schema

import (
	"encoding/json"
	"fmt"
	"strings"
	"sync"

	"github.com/anytypeio/go-anytype-middleware/pkg/lib/logging"
)

var log = logging.Logger("anytype-core-schema")

type Schema struct {
	Schema      string `json:"$schema"`
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Type        string `json:"type"`
	Items       struct {
		Ref string `json:"$ref"`
	} `json:"items"`
	UniqueItems bool       `json:"uniqueItems"`
	Default     []Relation `json:"default"`
}

type Relation struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	IsHidden   bool   `json:"isHidden"`
	IsReadonly bool   `json:"isReadonly"`
	Type       string `json:"type"`
}

var schemaCache = map[string]*Schema{}
var schemaCacheMutex = sync.Mutex{}

func Get(url string) (*Schema, error) {
	schemaCacheMutex.Lock()
	defer schemaCacheMutex.Unlock()
	if v, exist := schemaCache[url]; exist {
		return v, nil
	}

	if v, exists := SchemaByURL[url]; !exists {
		return nil, fmt.Errorf("schema not found")
	} else {
		var sch Schema
		err := json.NewDecoder(strings.NewReader(v)).Decode(&sch)
		if err != nil {
			return nil, err
		}
		schemaCache[url] = &sch
		return &sch, nil
	}
}

func (sch *Schema) GetRelationById(id string) (*Relation, error) {
	for _, rel := range sch.Default {
		if rel.ID == id {
			return &rel, nil
		}
	}
	return nil, fmt.Errorf("not found")
}

// Todo: data validation
