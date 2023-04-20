
import { environment } from 'framework';        // named import
  import { request as req } from 'framework';     // namespaced import
  import api from 'framework';                    // default import
  import * as APP from 'framework';               // namespaced imort
export default {
  props: {
      description: {
          type: String,
          default: ''
      }
  }
};
