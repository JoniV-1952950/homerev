import { MedAPI } from "../datasources/med";
import { UsersAPI } from "../datasources/users";
import { Operator, FilterType } from "./enums";

export type PageDetails = {
    // The document ID from where to start. Is only used when next is true. 
    // Only use when pagination is possible => when not dealing with a list of items in a list of items
    afterDocID: string, 
    // The document ID where to end at. Is only used when next is false. 
    // Only use when pagination is possible => when not dealing with a list of items in a list of items
    beforeDocID: string, 
    // Specifies the number of elements to get per page
    perPage: number, 
    // Specifies whether to search for the next page or the previous one. 
    // Only use when pagination is possible => when not dealing with a list of items in a list of items
    next: boolean
};

export type Filter = {
    // Contains the name of the field you want to filter
    field: string,
    // Can be any of type Operator. These determine the comparison made.
    operator: Operator,
    // The value to compare to. If this is supposed to be an array, separate the elements by a ','. 
    value: string,
    // The type of the given value
    type: FilterType,
    // Defines if the the given value is an array of values or not
    array: boolean
};

// define the type of the context
export type Context = {
    dataSources: {
      usersAPI: UsersAPI,
      medAPI: MedAPI
    },
    user: {
      uid: String,
      role: String
    }
  }