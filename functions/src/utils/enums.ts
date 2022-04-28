// gender enum used as filter
export enum Gender {
    M = "M", 
    V = "V", 
    X = "X"
}

// operator enum, used to map incoming operator arguments to a string
export enum Operator {
    lt = "<",
    lte = "<=",
    gt = ">",
    gte = ">=",
    eq = "==",
    neq = "!=",
    arr_contains = "array-contains",
    in = "in",
    not_in = "not-in"
}

// All types scalars a query can be done with
export enum FilterType {
    // String type
    String = "String",
    // Int type
    Int = "Int",
    // Float type
    Float = "Float",
    // Boolean, true or false
    Boolean = "Boolean",
    // Date
    Date = "Date",
    // DateTime
    DateTime = "DateTime"
}