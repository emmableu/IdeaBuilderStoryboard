export class DashboardData {
    userID: string;
    projectMap: {
        [key:string]: {
            name: string
        }
    };

    constructor (userID:string, projectMap?:{
                    [key:string]: {
                        name: string } })
    {
        this.userID = userID;
        this.projectMap = projectMap? projectMap:{};
    }

    toJSON () {
        return {
            userID: this.userID,
            projectMap: this.projectMap,
        }
    }

    toString () {
        return JSON.stringify(this.toJSON())
    }

    static parse (dashboardJSON: {userID:string, projectMap?:{
            [key:string]: {
                name: string } }}): DashboardData {
        return new DashboardData(
            dashboardJSON.userID,
            dashboardJSON.projectMap
        )
    }

}
