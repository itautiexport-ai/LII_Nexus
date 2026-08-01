export class Format {
  constructor(
    public readonly id: string,
    public title: string,
    public description: string | null,
    public icon: string | null,
    public fileUrl: string,
    public createdAt: Date,
    public updatedAt: Date
  ) {}
}
