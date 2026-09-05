import { QuizPlayer } from "@/components/quiz-player";
import { demoQuestionSet } from "@/data/demo-question-set";

export default function DemoQuizPage() {
  return <section className="narrow"><QuizPlayer questionSet={demoQuestionSet} demoAnswerSet={demoQuestionSet} /></section>;
}
