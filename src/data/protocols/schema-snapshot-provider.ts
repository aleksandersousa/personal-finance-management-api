export interface SchemaSnapshotProvider {
  getSnapshot(): Promise<string>;
}
