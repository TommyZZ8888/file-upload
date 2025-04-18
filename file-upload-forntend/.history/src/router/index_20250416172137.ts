import Vue from "vue";
import VueRouter from "vue-router";
// import FileUpload from '@/views/FileUpload.vue';
import MainPage from "@/views/MainPage.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "home",
    component: MainPage,
  },
  {
    path: "/LabelStudio",
    name: "LabelStudio",
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
