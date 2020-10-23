package schema

import (
	"fmt"

	"github.com/anytypeio/go-anytype-middleware/pkg/lib/logging"
	pbrelation "github.com/anytypeio/go-anytype-middleware/pkg/lib/pb/relation"
)

var log = logging.Logger("anytype-core-schema")

type Schema struct {
	ObjType *pbrelation.ObjectType
}

func New(objType *pbrelation.ObjectType) Schema {
	return Schema{ObjType: objType}
}

func (sch *Schema) GetRelationByKey(key string) (*pbrelation.Relation, error) {
	for _, rel := range sch.ObjType.Relations {
		if rel.Key == key {
			return rel, nil
		}
	}
	return nil, fmt.Errorf("not found")
}

// Todo: data validation
