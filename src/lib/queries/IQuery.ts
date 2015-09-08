import Table from "../Table";
interface IQuery<T> {
	_table: Table<T>;

	execute(rawCriteria: any, callback?: (_results: any) => any): Promise<any>;
}

interface IQueryConstructor<T> {
	new(_table: Table<T>): IQuery<T>;
}

export default IQuery;

