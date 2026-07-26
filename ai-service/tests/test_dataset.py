from pathlib import Path

from training.validate_dataset import parse_label, validate_dataset


def test_valid_yolo_label(tmp_path: Path):
    label = tmp_path / "sample.txt"
    label.write_text("0 0.5 0.5 0.2 0.3\n7 0.2 0.2 0.1 0.1\n", encoding="utf-8")
    counts, issues = parse_label(label, class_count=8)
    assert counts == {0: 1, 7: 1}
    assert issues == []


def test_dataset_reports_missing_labels(tmp_path: Path):
    image = tmp_path / "images" / "train" / "road.jpg"
    image.parent.mkdir(parents=True)
    image.write_bytes(b"placeholder")
    report = validate_dataset(tmp_path)
    assert report.images == 1
    assert not report.valid
    assert "missing" in report.issues[0].message
