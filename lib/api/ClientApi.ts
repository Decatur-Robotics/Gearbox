import ApiDependencies from "./ApiDependencies";
import ApiLib from "./ApiLib";

export default class ClientApi extends ApiLib.ApiTemplate<ApiDependencies> {
  constructor() {
    super(false);
    this.init();
  }
}