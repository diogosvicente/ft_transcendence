import { Modal, Spinner } from "react-bootstrap";
import PropTypes from "prop-types";

function LoadingModal({ showLoading, handleClose }) {
  return (
    <Modal
      show={showLoading}
      onHide={handleClose}
      keyboard={false}
      size="sm"
      className="d-flex justify-content-center"
      centered
    >
      <Modal.Body className="d-flex justify-content-center align-items-center">
        <Spinner animation="border" />
      </Modal.Body>
    </Modal>
  );
}

LoadingModal.propTypes = {
  showLoading: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
};

export default LoadingModal;
