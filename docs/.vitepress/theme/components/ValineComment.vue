<template>
  <div class="page">
    <section class="page-edit">
      <div id="vcomments"></div>
    </section>
  </div>
</template>

<script setup>
import { watch, onMounted } from "vue";
import { useRoute } from "vitepress";

const route = useRoute();

const initValine = () => {
  let path = location.origin + location.pathname;
  document.getElementsByClassName("leancloud-visitors")[0].id = path;
  new Valine({
    el: "#vcomments",
    appId: 'haIm5FeUe01oJTIEMfDVhedg-gzGzoHsz',// your appId
    appKey: 'kDqlmQdihqGffFnTesNcm86x', // your appKey
    notify: false,
    verify: false,
    path: path,
    visitor: true,
    avatar: "mm",
    placeholder:
      "客官，留下点什么吧！",
  });
};

watch(
  () => route.path,
  () => {
    console.log("监听路由变化");
    initValine();
  }
);

onMounted(() => {
  remoteImport('//unpkg.com/valine/dist/Valine.min.js').then(() => initValine());
});

function remoteImport(url) {
  return new Promise((resolve) => {
    var head = document.getElementsByTagName("head")[0];
    var script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", url);
    head.appendChild(script);

    script.onload = function () {
      resolve();
    };
  });
}

</script>

