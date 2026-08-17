export class FinishingRecipeStep {
  constructor(
    public id: string,
    public recipeId: string,
    public stepNo: number,
    public processMaterial: string,
    public toolMachine: string,
    public gritQuantity: string,
    public dryingTime: string,
    public notes: string,
    public noOfCoats: string,
    public createdAt?: Date
  ) {}
}

export class FinishingRecipe {
  constructor(
    public id: string,
    public itemCode: string,
    public finishCode: string,
    public itemDescription: string,
    public createdOn: string, // YYYY-MM-DD
    public buyerCode: string,
    public glossLevel: string,
    public woodType: string,
    public steps: FinishingRecipeStep[],
    public createdAt?: Date,
    public updatedAt?: Date
  ) {}
}
