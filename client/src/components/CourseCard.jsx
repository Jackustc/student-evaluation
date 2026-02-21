import { useNavigate } from "react-router-dom";
import "../styles/CourseCard.css";

export default function CourseCard({ course, isInstructor = false }) {
  const navigate = useNavigate();

  // 路径区分：老师进入 /instructor/courses/:id，学生进入 /courses/:id
  const path = isInstructor
    ? `/instructor/courses/${course.id}`
    : `/courses/${course.id}`;

  return (
    <div className="course-card" onClick={() => navigate(path)}>
      <h4 className="course-card-title">{course.title}</h4>
      <p className="course-card-meta">
        ({course.code})<br />
        {isInstructor ? (
          <>
            Token: <strong>{course.joinToken}</strong>
          </>
        ) : (
          <>Instructor: {course.instructor?.name}</>
        )}
      </p>

       {/* {isInstructor && (
        <button
          className="delete-btn"
          onClick={(e) => {
            e.stopPropagation(); // ⭐ 阻止跳转
            onDelete(course);
          }}
        >
          Delete
        </button>
      )} */}
    </div>
  );
}
