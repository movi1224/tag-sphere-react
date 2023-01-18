import "./styles.css"
import TagSphere from "./TagSphere"
export default function App() {
  const skills = [
    "HTML",
    "CSS",
    "SASS",
    "JavaScript",
    "TypeScript",
    "TailwindCSS",
    "MUI",
    "Express",
    "MongoDB",
    "SQL",
    "React",
    "Vue",
    "Node.js",
    "Babel",
    "StoryBook",
    "ES6",
    "Jest",
    "Webpack",
    "Git",
    "GitHub",
    "EJS",
    "RESTful API"
  ]
  const options = {
    radius: 200,
    maxSpeed: 1.5
  }

  return (
    <div className="App">
      <h1>3D Tag Sphere React</h1>
      <h2>Configure by texts and options</h2>
      <h3>
        Styles could be modified by class .tagsphere and .tagsphere--item{" "}
      </h3>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <TagSphere texts={skills} options={options} />
      </div>
    </div>
  )
}
