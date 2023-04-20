<template>
  <div class="empty">
      <img src="../img/empty.png" alt="数据为空">
      <span class="text">{{ description }}</span>
  </div>
</template>

<script>
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
</script>
<style lang="scss" scoped>
.empty {
position: absolute;
top: 50%;
left: 50%;
transform: translate(-50%, -50%);
display: flex;
flex-direction: column;
align-items: center;
width: 100%;
.text {
  margin-top: 16px;
  color: #999999;
}
}
</style>
