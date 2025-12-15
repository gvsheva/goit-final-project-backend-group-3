export class CurrentUserDto {
    declare id: string;
    declare name: string;
    declare email: string;
    declare avatar: string;
    declare recipesAmount: number;
    declare favoriteRecipesAmount: number;
    declare followersAmount: number;
    declare followingsAmount: number;


    constructor(id: string, name: string, email: string, avatar: string, addedRecipes: number, favorites: number, followers: number, following: number) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.avatar = avatar;
        this.recipesAmount = addedRecipes;
        this.favoriteRecipesAmount = favorites;
        this.followersAmount = followers;
        this.followingsAmount = following;
    }
}
