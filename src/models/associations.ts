// import { blogsAssociations } from "./blogs";
import { pagesAssociations } from "./pages";
import { sliderAssociations } from "./sliders";
import { applyServiceAssociations } from "./services/services";
import { applyHomeServiceAssociations } from "./services/home_services";
import { featuresAssociations } from "./features";
import { titlesAssociations } from "./titles";
import { applySectionAssociations } from "./service_sections/sections";
// import { blogsAssociations } from "./blogs/blogs";
import { aboutAssociations } from "./about_us";
import { ProjectRelations } from "./projects/project";
import { tenantAssociations } from "./tenant";

const applyAssociations = () => {
  //   blogsAssociations();
  applyServiceAssociations();
  pagesAssociations();
  applyHomeServiceAssociations();
  sliderAssociations();
  featuresAssociations();
  titlesAssociations();
  applySectionAssociations();
  aboutAssociations();
  ProjectRelations();
  tenantAssociations();
};

export default applyAssociations;
